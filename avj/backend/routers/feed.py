"""
Real-time feed via WebSocket.
Authenticated via ?token= query param (JWT) since browsers can't send
Authorization headers on WebSocket connections.
"""
from __future__ import annotations

import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import decode_token
from database import AsyncSessionLocal
from models import Friendship, User
from services.helpers import serialize_friend
from ws_manager import manager

log = logging.getLogger("avj.feed")
router = APIRouter(tags=["feed"])


@router.websocket("/ws/feed")
async def ws_feed(websocket: WebSocket, token: str = Query(...)):
    # Authenticate
    try:
        payload = decode_token(token)
        user_id = payload["sub"]
    except Exception:
        await websocket.close(code=4001)
        return

    await manager.connect(websocket, user_id)

    try:
        # Send initial snapshot of friends
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(Friendship).where(
                    Friendship.status == "accepted",
                    or_(Friendship.user_id == user_id, Friendship.friend_id == user_id),
                )
            )
            rows = result.scalars().all()
            friend_ids = [
                row.friend_id if row.user_id == user_id else row.user_id
                for row in rows
            ]
            if friend_ids:
                result2 = await db.execute(select(User).where(User.id.in_(friend_ids)))
                friends = [serialize_friend(u) for u in result2.scalars().all()]
            else:
                friends = []

        await websocket.send_text(json.dumps({
            "type": "snapshot",
            "friends": friends,
        }))

        # Keep alive — handle pings
        while True:
            msg = await websocket.receive_text()
            if msg == "ping":
                await websocket.send_text('{"type":"pong"}')

    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(websocket, user_id)
