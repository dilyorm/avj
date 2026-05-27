"""
Avj — FastAPI backend
Real auth, real Spotify/Yandex integration, real-time WebSocket feed.
"""
from __future__ import annotations

import asyncio
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from database import init_db
from routers import auth, connect, feed, friends, users

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
log = logging.getLogger("avj")

settings = get_settings()

app = FastAPI(
    title="Avj API",
    version="0.2.0",
    description="Social music feed — real Spotify + Yandex Music integration",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(friends.router)
app.include_router(connect.router)
app.include_router(feed.router)


@app.on_event("startup")
async def startup() -> None:
    await init_db()
    log.info("Database initialized")

    if settings.spotify_configured:
        log.info("Spotify configured ✓ (client_id=%s...)", settings.spotify_client_id[:8])
    else:
        log.warning("Spotify NOT configured — add SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET to .env")

    # Start background poller
    from services.poller import run_poller
    asyncio.create_task(run_poller())
    log.info("Background poller started (interval=%ds)", settings.poll_interval)


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "spotify_configured": settings.spotify_configured,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
