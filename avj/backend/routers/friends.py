from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from database import get_db
from models import Friendship, User
from services.helpers import serialize_friend, serialize_public

router = APIRouter(prefix="/api", tags=["friends"])


# ─── Helpers ──────────────────────────────────────────────────────────────────

async def _friendship(current_id: str, target_id: str, db: AsyncSession):
    """Return the Friendship row between two users (any direction), or None."""
    result = await db.execute(
        select(Friendship).where(
            or_(
                (Friendship.user_id == current_id) & (Friendship.friend_id == target_id),
                (Friendship.user_id == target_id) & (Friendship.friend_id == current_id),
            )
        )
    )
    return result.scalar_one_or_none()


def _fs(row: Friendship | None, current_id: str) -> str:
    """friendship_status string from a Friendship row."""
    if row is None:
        return "none"
    if row.status == "accepted":
        return "friends"
    return "pending_sent" if row.user_id == current_id else "pending_received"


async def _get_friend_users(current_id: str, db: AsyncSession) -> list[User]:
    """Return User objects for all accepted friends."""
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


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/friends")
async def list_friends(
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    users = await _get_friend_users(current.id, db)
    friends = [serialize_friend(u, friendship_status="friends") for u in users]
    friends.sort(key=lambda f: (f["status"] != "live", not f.get("song")))
    return friends


@router.get("/friend-requests")
async def list_friend_requests(
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Incoming pending friend requests (others sent to me)."""
    result = await db.execute(
        select(Friendship).where(
            Friendship.friend_id == current.id,
            Friendship.status == "pending",
        )
    )
    rows = result.scalars().all()
    if not rows:
        return []
    sender_ids = [row.user_id for row in rows]
    result2 = await db.execute(select(User).where(User.id.in_(sender_ids)))
    senders = {u.id: u for u in result2.scalars().all()}
    return [
        {**serialize_public(senders[row.user_id], friendship_status="pending_received"), "request_id": row.id}
        for row in rows
        if row.user_id in senders
    ]


@router.get("/friends/{user_id}")
async def get_friend_profile(
    user_id: str,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")

    row = await _friendship(current.id, user_id, db)
    status = _fs(row, current.id)

    if status == "friends":
        return serialize_friend(user, friendship_status="friends")
    return serialize_public(user, friendship_status=status)


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

    existing = await _friendship(current.id, user_id, db)
    if existing:
        if existing.status == "accepted":
            return {"ok": True, "status": "friends"}
        if existing.user_id == current.id:
            return {"ok": True, "status": "pending_sent"}
        # They sent to us — auto-accept mutual interest
        existing.status = "accepted"
        await db.commit()
        return {"ok": True, "status": "friends"}

    db.add(Friendship(user_id=current.id, friend_id=user_id, status="pending"))
    await db.commit()
    return {"ok": True, "status": "pending_sent"}


@router.post("/friends/{user_id}/accept")
async def accept_friend(
    user_id: str,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    row = await _friendship(current.id, user_id, db)
    if not row or row.status != "pending":
        raise HTTPException(404, "No pending request found")
    if row.user_id == current.id:
        raise HTTPException(400, "Cannot accept your own request")
    row.status = "accepted"
    await db.commit()
    return {"ok": True, "status": "friends"}


@router.post("/friends/{user_id}/reject")
async def reject_friend(
    user_id: str,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    row = await _friendship(current.id, user_id, db)
    if row:
        await db.delete(row)
        await db.commit()
    return {"ok": True}


@router.delete("/friends/{user_id}")
async def remove_friend(
    user_id: str,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    row = await _friendship(current.id, user_id, db)
    if row:
        await db.delete(row)
        await db.commit()
    return {"ok": True}


@router.get("/suggestions")
async def get_suggestions(
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Users with no friendship relation to current user."""
    result = await db.execute(
        select(Friendship).where(
            or_(Friendship.user_id == current.id, Friendship.friend_id == current.id)
        )
    )
    related_ids = {current.id}
    for row in result.scalars().all():
        related_ids.add(row.user_id)
        related_ids.add(row.friend_id)

    result2 = await db.execute(
        select(User).where(User.id.notin_(related_ids)).limit(20)
    )
    return [serialize_public(u, friendship_status="none") for u in result2.scalars().all()]


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
            or_(User.name.ilike(pattern), User.handle.ilike(pattern)),
        ).limit(20)
    )
    users = result.scalars().all()

    out = []
    for u in users:
        row = await _friendship(current.id, u.id, db)
        status = _fs(row, current.id)
        if status == "friends":
            out.append(serialize_friend(u, friendship_status="friends"))
        else:
            out.append(serialize_public(u, friendship_status=status))
    return out
