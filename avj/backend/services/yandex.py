"""
Yandex Music integration via yandex-music Python library.
Token: Yandex OAuth access_token (NOT Session_id cookie).

To get a token, the user authorizes via our OAuth flow at /api/connect/yandex/auth.
"""
from __future__ import annotations

import logging

log = logging.getLogger("avj.yandex")

try:
    from yandex_music import ClientAsync as YMClient
    YANDEX_AVAILABLE = True
except ImportError:
    YANDEX_AVAILABLE = False
    log.warning("yandex-music not installed — Yandex Music integration disabled")


async def validate_token(token: str) -> dict | None:
    """Return basic account info if token valid, else None."""
    if not YANDEX_AVAILABLE:
        return None
    try:
        client = await YMClient(token).init()
        # client.init() succeeded — token is valid. Try to get account info.
        try:
            me = await client.account_status()
            account = me.account
            return {
                "uid":   account.uid,
                "login": account.login,
                "name":  account.full_name or account.login,
            }
        except Exception:
            # Token valid (init succeeded) but response parsing failed due to
            # library/API version mismatch — still accept the token.
            return {"uid": None, "login": "unknown", "name": "Yandex User"}
    except Exception as e:
        log.warning("Yandex token validation failed: %s", e)
        return None


async def get_current_track(token: str) -> dict | None:
    """
    Returns current track dict or None.
    Uses queues API — selects the most recently modified queue as the active one.
    Works when user is actively listening in Yandex Music app or web player.
    """
    if not YANDEX_AVAILABLE:
        return None
    try:
        client = await YMClient(token).init()
        queues = await client.queues_list()
        if not queues:
            return None

        # Most recently modified queue = active one
        latest = max(queues, key=lambda q: q.modified or "")

        # Fetch full queue with track list
        queue = await client.queue(latest.id)
        if queue is None or queue.current_index is None:
            return None

        idx = queue.current_index
        if not queue.tracks or idx >= len(queue.tracks):
            return None

        track_short = queue.tracks[idx]

        # Build track ID string for fetch
        track_id_str = f"{track_short.id}"
        if hasattr(track_short, "album_id") and track_short.album_id:
            track_id_str = f"{track_short.id}:{track_short.album_id}"

        tracks = await client.tracks([track_id_str])
        if not tracks:
            return None

        track = tracks[0]
        artists = ", ".join(a.name for a in (track.artists or []))
        album_title = track.albums[0].title if track.albums else ""

        return {
            "song":       track.title,
            "artist":     artists,
            "album":      album_title,
            "platform":   "yandex",
            "mins":       None,
            "is_playing": True,
        }

    except Exception as e:
        log.debug("Yandex get_current_track failed: %s", e)
        return None


async def get_recently_played(token: str, limit: int = 5) -> list[dict]:
    """Return recently played tracks from the user's last queue."""
    if not YANDEX_AVAILABLE:
        return []
    try:
        client = await YMClient(token).init()
        queues = await client.queues_list()
        if not queues:
            return []

        latest = max(queues, key=lambda q: q.modified or "")
        queue = await client.queue(latest.id)
        if not queue or not queue.tracks:
            return []

        # Get tracks before the current index (recently played)
        idx = queue.current_index or 0
        track_shorts = queue.tracks[max(0, idx - limit):idx]
        if not track_shorts:
            track_shorts = queue.tracks[:min(limit, len(queue.tracks))]

        ids = []
        for t in track_shorts:
            tid = f"{t.id}:{t.album_id}" if hasattr(t, "album_id") and t.album_id else str(t.id)
            ids.append(tid)

        if not ids:
            return []

        tracks = await client.tracks(ids)
        result = []
        for track in tracks:
            result.append({
                "song":     track.title,
                "artist":   ", ".join(a.name for a in (track.artists or [])),
                "album":    track.albums[0].title if track.albums else "",
                "platform": "yandex",
            })
        return result[:limit]

    except Exception as e:
        log.debug("Yandex recently_played failed: %s", e)
        return []
