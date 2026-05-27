"""
Platform connection routes.
Spotify: real OAuth flow (Authorization Code).
Yandex: token-based (user provides their token).
"""
import secrets

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user, create_access_token
from config import get_settings
from database import get_db
from models import User
from schemas import ConnectYandexRequest, ConnectStatusResponse
from services import spotify as sp_svc, yandex as ym_svc

router = APIRouter(prefix="/api/connect", tags=["connect"])
settings = get_settings()

# In-memory state store (state → user_id) for OAuth CSRF protection
# In production: use Redis or DB
_oauth_states: dict[str, str] = {}


# ─── Spotify ──────────────────────────────────────────────────

@router.get("/spotify/auth")
async def spotify_auth(current: User = Depends(get_current_user)):
    if not settings.spotify_configured:
        raise HTTPException(503, "Spotify not configured — add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to .env")

    state = secrets.token_urlsafe(16)
    _oauth_states[state] = current.id

    url = sp_svc.get_auth_url(state)
    return {"url": url}


@router.get("/spotify/callback")
async def spotify_callback(
    code: str = Query(None),
    state: str = Query(None),
    error: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    fe = settings.frontend_url.rstrip("/")
    if error or not code or not state:
        return RedirectResponse(url=f"{fe}/connect?error=spotify_denied")

    user_id = _oauth_states.pop(state, None)
    if not user_id:
        return RedirectResponse(url=f"{fe}/connect?error=invalid_state")

    try:
        data = await sp_svc.exchange_code(code)
    except Exception:
        return RedirectResponse(url=f"{fe}/connect?error=spotify_exchange_failed")

    from sqlalchemy import select
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return RedirectResponse(url=f"{fe}/connect?error=user_not_found")

    user.spotify_access_token = data["access_token"]
    user.spotify_refresh_token = data.get("refresh_token")
    user.spotify_token_expires = sp_svc.token_expires_at(data["expires_in"])
    await db.commit()

    return RedirectResponse(url=f"{fe}/connect?spotify=connected")


@router.delete("/spotify")
async def disconnect_spotify(
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current.spotify_access_token = None
    current.spotify_refresh_token = None
    current.spotify_token_expires = None
    await db.commit()
    return ConnectStatusResponse(platform="spotify", connected=False)


# ─── Yandex Music ─────────────────────────────────────────────

@router.post("/yandex")
async def connect_yandex(
    body: ConnectYandexRequest,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    info = await ym_svc.validate_token(body.token)
    if info is None:
        raise HTTPException(400, "Invalid Yandex Music token — check your token and try again")

    current.yandex_token = body.token
    await db.commit()
    return ConnectStatusResponse(platform="yandex", connected=True)


@router.delete("/yandex")
async def disconnect_yandex(
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current.yandex_token = None
    await db.commit()
    return ConnectStatusResponse(platform="yandex", connected=False)


# ─── Status ───────────────────────────────────────────────────

@router.get("/status")
async def connect_status(current: User = Depends(get_current_user)):
    return {
        "spotify": {
            "connected": bool(current.spotify_access_token),
            "spotify_configured": settings.spotify_configured,
        },
        "yandex": {
            "connected": bool(current.yandex_token),
        },
    }
