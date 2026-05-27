"""
Yandex Music integration via unofficial yandex-music Python library.
Token: user provides manually (from browser cookies or Yandex OAuth).
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
        me = await client.account_status()
        account = me.account
        return {
            "uid":      account.uid,
            "login":    account.login,
            "name":     account.full_name or account.login,
        }
    except Exception as e:
        log.debug("Yandex token validation failed: %s", e)
        return None


async def get_current_track(token: str) -> dict | None:
    """
    Returns current track dict or None.
    Uses the queues API — works when user is active in the Yandex Music app/web.
    """
    if not YANDEX_AVAILABLE:
        return None
    try:
        client = await YMClient(token).init()
        queues = await client.queues_list()
        if not queues:
            return None

        queue_obj = await client.queue(queues[0].id)
        idx = queue_obj.current_index
        if idx is None or idx >= len(queue_obj.tracks):
            return None

        track_short = queue_obj.tracks[idx]
        track = await track_short.fetch_track_async()

        artists = ", ".join(a.name for a in (track.artists or []))
        album_title = track.albums[0].title if track.albums else ""

        return {
            "song":     track.title,
            "artist":   artists,
            "album":    album_title,
            "platform": "yandex",
            "mins":     None,
            "is_playing": True,
        }
    except Exception as e:
        log.debug("Yandex get_current_track failed: %s", e)
        return None


async def get_recently_played(token: str, limit: int = 5) -> list[dict]:
    """Fallback: return liked tracks as 'recently played' approximation."""
    if not YANDEX_AVAILABLE:
        return []
    try:
        client = await YMClient(token).init()
        # Use feed or landing for recent tracks
        landing = await client.landing("personalplaylists")
        results: list[dict] = []
        for block in (landing.blocks or []):
            for entity in (block.entities or [])[:limit]:
                data = entity.data
                if hasattr(data, "data") and hasattr(data.data, "tracks"):
                    for t in (data.data.tracks or [])[:2]:
                        results.append({
                            "song":     t.title,
                            "artist":   ", ".join(a.name for a in (t.artists or [])),
                            "album":    t.albums[0].title if t.albums else "",
                            "platform": "yandex",
                        })
                        if len(results) >= limit:
                            return results
        return results
    except Exception as e:
        log.debug("Yandex recently_played failed: %s", e)
        return []
