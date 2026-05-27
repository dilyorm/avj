"""
Shared serialization helpers to avoid circular imports.
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from models import User


def _ago(dt: datetime | None) -> str:
    if not dt:
        return ""
    delta = datetime.utcnow() - dt
    s = int(delta.total_seconds())
    if s < 60:
        return "hozir"
    if s < 3600:
        return f"{s // 60} daq"
    if s < 86400:
        return f"{s // 3600} soat"
    return f"{s // 86400} kun"


def serialize_friend(u: "User") -> dict:
    """Serialize a User into FriendOut-compatible dict."""
    is_live = u.is_live
    recent = []
    for ev in (u.events or [])[:5]:
        recent.append({
            "id":         ev.id,
            "song":       ev.song,
            "artist":     ev.artist,
            "album":      ev.album,
            "platform":   ev.platform,
            "started_at": ev.started_at.isoformat(),
        })

    return {
        "id":       u.id,
        "name":     u.name,
        "handle":   u.handle,
        "platform": u.now_platform if is_live else None,
        "status":   "live" if is_live else "past",
        "ago":      _ago(u.now_updated) if is_live else _ago(u.now_updated),
        "mins":     None,
        "song":     u.now_song if is_live else (u.events[0].song if u.events else None),
        "artist":   u.now_artist if is_live else (u.events[0].artist if u.events else None),
        "album":    u.now_album if is_live else (u.events[0].album if u.events else None),
        "spotify":  bool(u.spotify_access_token),
        "yandex":   bool(u.yandex_token),
        "recent":   recent,
    }


def serialize_me(u: "User", friend_count: int = 0, track_count: int = 0) -> dict:
    now = None
    if u.is_live and u.now_song:
        now = {
            "song":     u.now_song,
            "artist":   u.now_artist or "",
            "album":    u.now_album or "",
            "platform": u.now_platform or "spotify",
        }
    return {
        "id":          u.id,
        "name":        u.name,
        "handle":      u.handle,
        "email":       u.email,
        "city":        u.city,
        "visible":     u.visible,
        "spotify":     bool(u.spotify_access_token),
        "yandex":      bool(u.yandex_token),
        "friend_count": friend_count,
        "track_count":  track_count,
        "now":         now,
    }
