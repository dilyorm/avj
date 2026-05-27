"""
Background poller.
Every POLL_INTERVAL seconds:
  1. Load all users with connected Spotify or Yandex tokens.
  2. For each, poll the platform API for currently-playing.
  3. If the track changed, update the DB and broadcast to friends' WebSocket connections.
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from config import get_settings
from database import AsyncSessionLocal
from models import Friendship, ListeningEvent, User
from services import spotify as sp_svc, yandex as ym_svc
from ws_manager import manager as ws

log = logging.getLogger("avj.poller")
settings = get_settings()


async def _refresh_spotify_if_needed(user: User, db: AsyncSession) -> bool:
    """Refresh Spotify access token if expired. Returns True if token is valid."""
    if not user.spotify_refresh_token:
        return False
    now = datetime.utcnow()
    if user.spotify_token_expires and user.spotify_token_expires > now:
        return True  # still valid
    try:
        data = await sp_svc.refresh_token(user.spotify_refresh_token)
        user.spotify_access_token = data["access_token"]
        user.spotify_token_expires = sp_svc.token_expires_at(data["expires_in"])
        if "refresh_token" in data:
            user.spotify_refresh_token = data["refresh_token"]
        await db.commit()
        return True
    except Exception as e:
        log.warning("Failed to refresh Spotify token for %s: %s", user.handle, e)
        return False


async def _poll_user(user: User, db: AsyncSession) -> dict | None:
    """Poll one user's platforms. Return new track dict if changed, else None."""
    track: dict | None = None

    # Try Spotify first
    if user.spotify_access_token:
        if await _refresh_spotify_if_needed(user, db):
            try:
                track = await sp_svc.get_current_track(user.spotify_access_token)
            except Exception as e:
                log.debug("Spotify poll error for %s: %s", user.handle, e)

    # Try Yandex if Spotify returned nothing
    if not track and user.yandex_token:
        try:
            track = await ym_svc.get_current_track(user.yandex_token)
        except Exception as e:
            log.debug("Yandex poll error for %s: %s", user.handle, e)

    # Detect change
    if track and track.get("is_playing"):
        new_song = track["song"]
        new_artist = track["artist"]
        new_platform = track["platform"]
        changed = (
            user.now_song != new_song
            or user.now_artist != new_artist
            or user.now_platform != new_platform
        )
        if changed:
            # Write listening event for history
            event = ListeningEvent(
                user_id=user.id,
                song=new_song,
                artist=new_artist,
                album=track.get("album", ""),
                platform=new_platform,
            )
            db.add(event)

        # Always update cache + timestamp
        user.now_song = new_song
        user.now_artist = new_artist
        user.now_album = track.get("album", "")
        user.now_platform = new_platform
        user.now_updated = datetime.utcnow()
        await db.commit()
        return track if changed else None

    elif user.now_song and user.is_live is False:
        # Was live, now stopped
        user.now_updated = None
        await db.commit()
        return {}  # sentinel: stopped playing

    return None


async def _get_friend_ids(user_id: str, db: AsyncSession) -> list[str]:
    """Get all friend user IDs for a given user (both directions)."""
    result = await db.execute(
        select(Friendship).where(
            Friendship.status == "accepted",
            (Friendship.user_id == user_id) | (Friendship.friend_id == user_id),
        )
    )
    rows = result.scalars().all()
    ids: list[str] = []
    for row in rows:
        other = row.friend_id if row.user_id == user_id else row.user_id
        ids.append(other)
    return ids


def _serialize_user_update(user: User) -> dict:
    from services.helpers import serialize_friend  # avoid circular at module level
    return {
        "type":   "friend_update",
        "friend": serialize_friend(user),
    }


async def poll_once() -> None:
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(User).where(
                (User.spotify_access_token.isnot(None)) | (User.yandex_token.isnot(None))
            )
        )
        users = result.scalars().all()

    tasks = []
    for user in users:
        tasks.append(_poll_one_and_broadcast(user))

    await asyncio.gather(*tasks, return_exceptions=True)


async def _poll_one_and_broadcast(user: User) -> None:
    async with AsyncSessionLocal() as db:
        # Re-fetch with session
        result = await db.execute(select(User).where(User.id == user.id))
        u = result.scalar_one_or_none()
        if not u:
            return

        changed = await _poll_user(u, db)
        if changed is None:
            return  # no change

        # Broadcast to friends who are online
        friend_ids = await _get_friend_ids(u.id, db)
        online_friends = [fid for fid in friend_ids if fid in ws.online_user_ids]
        if not online_friends:
            return

        await db.refresh(u)
        payload = {
            "type":   "friend_update",
            "friend": _build_friend_payload(u),
        }
        await ws.broadcast_to_users(online_friends, payload)
        log.info("Broadcast update for %s to %d friends", u.handle, len(online_friends))


def _build_friend_payload(u: User) -> dict:
    from services.helpers import serialize_friend
    return serialize_friend(u)


async def run_poller() -> None:
    log.info("Poller started — interval %ds", settings.poll_interval)
    while True:
        try:
            await poll_once()
        except Exception as e:
            log.error("Poller error: %s", e)
        await asyncio.sleep(settings.poll_interval)
