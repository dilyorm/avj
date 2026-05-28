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
    Uses queues API — works when Yandex Music mobile/desktop app has an active queue.
    Returns None for web browser playback (web player does not push queues to API).
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


async def get_recently_played(token: str, limit: int = 10) -> list[dict]:
    """
    Return recently played tracks from music_history.
    Works for both web browser and mobile/desktop app playback.
    """
    if not YANDEX_AVAILABLE:
        return []
    try:
        client = await YMClient(token).init()
        history = await client.music_history(full_models_count=limit)
        if not history or not history.history_tabs:
            return []

        result = []
        for tab in history.history_tabs:          # tabs = days, newest first
            # Tab-level timestamp/label fallbacks
            tab_iso = ""
            tab_label = ""
            try:
                for attr in ("timestamp", "date", "ts"):
                    v = getattr(tab, attr, None)
                    if v:
                        tab_iso = str(v)
                        break
                for attr in ("name", "title", "type_name", "type"):
                    v = getattr(tab, attr, None)
                    if v:
                        tab_label = str(v)
                        break
            except Exception:
                pass

            for group in (tab.items or []):
                # Group-level timestamp fallbacks
                group_iso = ""
                try:
                    for attr in ("timestamp", "date", "ts", "played_at"):
                        v = getattr(group, attr, None)
                        if v:
                            group_iso = str(v)
                            break
                except Exception:
                    pass

                for item in (group.tracks or []):
                    if item.type != "track":
                        continue
                    if not item.data or not item.data.full_model:
                        continue
                    t = item.data.full_model
                    # Item-level timestamp fallbacks
                    item_iso = ""
                    try:
                        for attr in ("timestamp", "played_at", "date", "ts"):
                            v = getattr(item, attr, None)
                            if v:
                                item_iso = str(v)
                                break
                    except Exception:
                        pass

                    played_at = item_iso or group_iso or tab_iso or tab_label
                    result.append({
                        "song":      t.title,
                        "artist":    ", ".join(a.name for a in (t.artists or [])),
                        "album":     t.albums[0].title if t.albums else "",
                        "platform":  "yandex",
                        "played_at": played_at,
                    })
                    if len(result) >= limit:
                        return result

        return result

    except Exception as e:
        log.debug("Yandex recently_played failed: %s", e)
        return []


async def get_liked_tracks_and_artists(token: str, limit: int = 20) -> tuple[list[dict], list[dict]]:
    """
    Return fallback profile data from Yandex likes.
    """
    if not YANDEX_AVAILABLE:
        return [], []
    try:
        client = await YMClient(token).init()
        likes = await client.users_likes_tracks()
        liked_tracks: list[dict] = []
        liked_artists_counter: dict[str, int] = {}

        track_ids = []
        for lt in (getattr(likes, "tracks", None) or [])[:limit]:
            if getattr(lt, "id", None):
                track_ids.append(str(lt.id))

        full_tracks = await client.tracks(track_ids) if track_ids else []
        for t in full_tracks:
            if not t:
                continue
            artist_names = [a.name for a in (t.artists or []) if getattr(a, "name", None)]
            artist_text = ", ".join(artist_names)
            liked_tracks.append({
                "song": t.title,
                "artist": artist_text,
                "album": t.albums[0].title if t.albums else "",
                "platform": "yandex",
                "play_count": 1,
            })
            for a in artist_names:
                liked_artists_counter[a] = liked_artists_counter.get(a, 0) + 1

        liked_artists = [
            {"artist": a, "play_count": c}
            for a, c in sorted(liked_artists_counter.items(), key=lambda x: x[1], reverse=True)[:limit]
        ]
        return liked_tracks[:limit], liked_artists
    except Exception as e:
        log.debug("Yandex liked tracks/artists failed: %s", e)
        return [], []
