from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models import Friendship, ListeningEvent, User
from schemas import UserUpdateRequest
from services.helpers import serialize_me

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
