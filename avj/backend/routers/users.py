from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models import Friendship, ListeningEvent, User
from schemas import UserUpdateRequest
from services.helpers import serialize_me
from services import yandex as ym_svc, spotify as sp_svc

router = APIRouter(prefix="/api", tags=["users"])


@router.get("/me")
async def get_me(current: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    # Friend count
    fc_result = await db.execute(
        select(func.count()).select_from(Friendship).where(
            Friendship.status == "accepted",
            (Friendship.user_id == current.id) | (Friendship.friend_id == current.id),
        )
    )
    friend_count = fc_result.scalar() or 0

    # Track count
    tc_result = await db.execute(
        select(func.count()).select_from(ListeningEvent).where(ListeningEvent.user_id == current.id)
    )
    track_count = tc_result.scalar() or 0

    return serialize_me(current, friend_count=friend_count, track_count=track_count)


@router.patch("/me")
async def update_me(
    body: UserUpdateRequest,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if body.name is not None:
        current.name = body.name
    if body.city is not None:
        current.city = body.city
    if body.visible is not None:
        current.visible = body.visible
    await db.commit()
    return {"ok": True}


@router.get("/me/history")
async def get_my_history(
    limit: int = Query(default=20, ge=1, le=50),
    current: User = Depends(get_current_user),
):
    """Return recent listening history from connected platforms."""
    tracks: list[dict] = []

    # Yandex Music history
    if current.yandex_token:
        ym_tracks = await ym_svc.get_recently_played(current.yandex_token, limit=limit)
        tracks.extend(ym_tracks)

    # Spotify recently played
    if current.spotify_access_token:
        try:
            sp_tracks = await sp_svc.get_recently_played(current.spotify_access_token, limit=limit)
            tracks.extend(sp_tracks)
        except Exception:
            pass

    # Deduplicate by (song, artist) keeping order
    seen: set[tuple[str, str]] = set()
    unique: list[dict] = []
    for t in tracks:
        key = (t.get("song", ""), t.get("artist", ""))
        if key not in seen:
            seen.add(key)
            unique.append(t)

    return {"tracks": unique[:limit]}
