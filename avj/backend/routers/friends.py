from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models import Friendship, User
from services.helpers import serialize_friend

router = APIRouter(prefix="/api", tags=["friends"])


async def _get_friend_users(current_id: str, db: AsyncSession) -> list[User]:
    """Return User objects for all accepted friends of current_id."""
    result = await db.execute(
        select(Friendship).where(
            Friendship.status == "accepted",
            or_(Friendship.user_id == current_id, Friendship.friend_id == current_id),
        )
    )
    rows = result.scalars().all()
    friend_ids = [
        row.friend_id if row.user_id == current_id else row.user_id
        for row in rows
    ]
    if not friend_ids:
        return []
    result2 = await db.execute(select(User).where(User.id.in_(friend_ids)))
    return list(result2.scalars().all())


@router.get("/friends")
async def list_friends(
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    users = await _get_friend_users(current.id, db)
    friends = [serialize_friend(u) for u in users]
    # Sort: live first, then by last updated
    friends.sort(key=lambda f: (f["status"] != "live", f.get("ago", "") == ""))
    return friends


@router.get("/friends/{user_id}")
async def get_friend(
    user_id: str,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    return serialize_friend(user)


@router.post("/friends/{user_id}/add")
async def add_friend(
    user_id: str,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if user_id == current.id:
        raise HTTPException(400, "Cannot add yourself")

    target = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not target:
        raise HTTPException(404, "User not found")

    existing = (
        await db.execute(
            select(Friendship).where(
                or_(
                    (Friendship.user_id == current.id) & (Friendship.friend_id == user_id),
                    (Friendship.user_id == user_id) & (Friendship.friend_id == current.id),
                )
            )
        )
    ).scalar_one_or_none()

    if existing:
        return {"ok": True, "already_friends": True}

    db.add(Friendship(user_id=current.id, friend_id=user_id, status="accepted"))
    await db.commit()
    return {"ok": True, "added": True}


@router.delete("/friends/{user_id}")
async def remove_friend(
    user_id: str,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Friendship).where(
            or_(
                (Friendship.user_id == current.id) & (Friendship.friend_id == user_id),
                (Friendship.user_id == user_id) & (Friendship.friend_id == current.id),
            )
        )
    )
    row = result.scalar_one_or_none()
    if row:
        await db.delete(row)
        await db.commit()
    return {"ok": True}


@router.get("/suggestions")
async def get_suggestions(
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Users not yet friends with current user — simple discovery."""
    friends = await _get_friend_users(current.id, db)
    friend_ids = {u.id for u in friends} | {current.id}

    result = await db.execute(select(User).where(User.id.notin_(friend_ids)).limit(20))
    suggestions = result.scalars().all()

    return [serialize_friend(u) for u in suggestions]


@router.get("/search")
async def search_users(
    q: str,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not q or len(q) < 2:
        return []

    pattern = f"%{q.lower()}%"
    result = await db.execute(
        select(User).where(
            User.id != current.id,
            or_(
                User.name.ilike(pattern),
                User.handle.ilike(pattern),
            ),
        ).limit(20)
    )
    users = result.scalars().all()
    return [serialize_friend(u) for u in users]
