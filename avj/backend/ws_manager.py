"""
WebSocket connection manager.
Tracks user_id → list of active WebSockets.
When a friend's listening status changes, broadcasts only to that friend's friends.
"""
from __future__ import annotations

import json
import logging
from collections import defaultdict

from fastapi import WebSocket

log = logging.getLogger("avj.ws")


class ConnectionManager:
    def __init__(self) -> None:
        # user_id → set of active WebSocket connections (multiple tabs)
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, ws: WebSocket, user_id: str) -> None:
        await ws.accept()
        self._connections[user_id].add(ws)
        log.debug("WS connected: user=%s total=%d", user_id, sum(len(v) for v in self._connections.values()))

    def disconnect(self, ws: WebSocket, user_id: str) -> None:
        self._connections[user_id].discard(ws)
        if not self._connections[user_id]:
            del self._connections[user_id]

    async def _send(self, ws: WebSocket, data: dict) -> bool:
        try:
            await ws.send_text(json.dumps(data, default=str))
            return True
        except Exception:
            return False

    async def send_to_user(self, user_id: str, data: dict) -> None:
        dead: set[WebSocket] = set()
        for ws in list(self._connections.get(user_id, set())):
            ok = await self._send(ws, data)
            if not ok:
                dead.add(ws)
        for ws in dead:
            self._connections[user_id].discard(ws)

    async def broadcast_to_users(self, user_ids: list[str], data: dict) -> None:
        """Broadcast a message to all specified online users."""
        for uid in user_ids:
            await self.send_to_user(uid, data)

    @property
    def online_user_ids(self) -> set[str]:
        return set(self._connections.keys())


# Singleton
manager = ConnectionManager()
