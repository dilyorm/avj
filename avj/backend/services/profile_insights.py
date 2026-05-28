from __future__ import annotations

from collections import Counter, defaultdict
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import ListeningEvent, User
from services import spotify as sp_svc, yandex as ym_svc


WINDOW_DAYS = 30
SPARSE_EVENTS_THRESHOLD = 5


def _to_iso_day(dt: datetime) -> str:
    return dt.astimezone(UTC).date().isoformat()


def _visibility(user: User) -> dict:
    return {
        "show_top_songs": bool(getattr(user, "show_top_songs", True)),
        "show_top_artists": bool(getattr(user, "show_top_artists", True)),
        "show_recent_played": bool(getattr(user, "show_recent_played", True)),
        "show_activity": bool(getattr(user, "show_activity", True)),
    }


async def _events_30d(db: AsyncSession, user_id: str) -> list[ListeningEvent]:
    cutoff = datetime.utcnow() - timedelta(days=WINDOW_DAYS)
    result = await db.execute(
        select(ListeningEvent)
        .where(ListeningEvent.user_id == user_id, ListeningEvent.started_at >= cutoff)
        .order_by(ListeningEvent.started_at.desc())
    )
    return list(result.scalars().all())


async def _yandex_likes(token: str | None) -> tuple[list[dict], list[dict]]:
    if not token:
        return [], []
    try:
        return await ym_svc.get_liked_tracks_and_artists(token)
    except Exception:
        return [], []


async def _spotify_recent(token: str | None, limit: int = 10) -> list[dict]:
    if not token:
        return []
    try:
        return await sp_svc.get_recently_played(token, limit=limit)
    except Exception:
        return []


async def build_profile_insights(user: User, db: AsyncSession) -> dict:
    events = await _events_30d(db, user.id)
    top_songs: list[dict] = []
    top_artists: list[dict] = []
    recent_played: dict | None = None
    has_fallback = False
    fallback_note: str | None = None

    # Activity from event stream only (source of truth)
    today = datetime.utcnow().date()
    day_counts: defaultdict[str, int] = defaultdict(int)
    for ev in events:
        day_counts[_to_iso_day(ev.started_at)] += 1
    plays_by_day = []
    for i in range(WINDOW_DAYS - 1, -1, -1):
        day = (today - timedelta(days=i)).isoformat()
        plays_by_day.append({"date": day, "plays": day_counts.get(day, 0)})

    plays_today = day_counts.get(today.isoformat(), 0)
    plays_last_7_days = sum(v for d, v in day_counts.items() if d >= (today - timedelta(days=6)).isoformat())
    plays_last_30_days = sum(day_counts.values())

    if events:
        ev0 = events[0]
        recent_played = {
            "song": ev0.song,
            "artist": ev0.artist,
            "album": ev0.album,
            "platform": ev0.platform,
            "last_listened_at": ev0.started_at.isoformat(),
            "source": "events",
        }

        song_counter: Counter[tuple[str, str, str, str]] = Counter()
        artist_counter: Counter[str] = Counter()
        for ev in events:
            song_counter[(ev.song, ev.artist, ev.album, ev.platform)] += 1
            for artist in [a.strip() for a in ev.artist.split(",") if a.strip()]:
                artist_counter[artist] += 1

        top_songs = [
            {"song": s, "artist": a, "album": alb, "platform": p, "play_count": c}
            for (s, a, alb, p), c in song_counter.most_common(10)
        ]
        top_artists = [{"artist": a, "play_count": c} for a, c in artist_counter.most_common(10)]

    if len(events) < SPARSE_EVENTS_THRESHOLD:
        # Fallback chain: recent -> top -> likes
        ym_recent = await ym_svc.get_recently_played(user.yandex_token, limit=10) if user.yandex_token else []
        sp_recent = await _spotify_recent(user.spotify_access_token, limit=10)
        merged_recent = ym_recent + sp_recent
        if not recent_played and merged_recent:
            r = merged_recent[0]
            recent_played = {
                "song": r.get("song", ""),
                "artist": r.get("artist", ""),
                "album": r.get("album", ""),
                "platform": r.get("platform", "yandex"),
                "last_listened_at": r.get("played_at", ""),
                "source": "history",
            }
            has_fallback = True
            fallback_note = "Not enough listening history. Showing recent plays."

        liked_tracks, liked_artists = await _yandex_likes(user.yandex_token)
        if not top_songs and liked_tracks:
            top_songs = liked_tracks[:10]
            has_fallback = True
            fallback_note = "Showing liked tracks as fallback."
        if not top_artists and liked_artists:
            top_artists = liked_artists[:10]
            has_fallback = True
            fallback_note = "Showing liked artists as fallback."

    return {
        "has_data": bool(recent_played or top_songs or top_artists or plays_last_30_days > 0),
        "has_fallback": has_fallback,
        "fallback_note": fallback_note,
        "recent_played": recent_played,
        "top_songs": top_songs,
        "top_artists": top_artists,
        "activity": {
            "plays_today": plays_today,
            "plays_last_7_days": plays_last_7_days,
            "plays_last_30_days": plays_last_30_days,
            "plays_by_day": plays_by_day,
            "source": "events",
        },
    }


def apply_visibility_filter(insights: dict, user: User, is_owner: bool) -> dict:
    if is_owner:
        return insights
    vis = _visibility(user)
    out = dict(insights)
    if not vis["show_recent_played"]:
        out["recent_played"] = None
    if not vis["show_top_songs"]:
        out["top_songs"] = []
    if not vis["show_top_artists"]:
        out["top_artists"] = []
    if not vis["show_activity"]:
        out["activity"] = {
            "plays_today": 0,
            "plays_last_7_days": 0,
            "plays_last_30_days": 0,
            "plays_by_day": [],
            "source": "events",
        }
    out["has_data"] = bool(out.get("recent_played") or out.get("top_songs") or out.get("top_artists") or out.get("activity", {}).get("plays_last_30_days", 0) > 0)
    return out


def visibility_payload(user: User) -> dict:
    return _visibility(user)
