"""
Platform connection routes.
Spotify: OAuth Authorization Code flow.
Yandex:  OAuth Implicit flow — token extracted from URL fragment by frontend callback page.
"""
import secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from auth import get_current_user
from config import get_settings
from database import get_db
from models import User
from schemas import ConnectYandexRequest, ConnectStatusResponse
from services import spotify as sp_svc, yandex as ym_svc

router = APIRouter(prefix="/api/connect", tags=["connect"])
settings = get_settings()

# In-memory state store (state → user_id) for OAuth CSRF protection
_oauth_states: dict[str, str] = {}


# ─── Spotify ──────────────────────────────────────────────────────────────────

@router.get("/spotify/auth")
async def spotify_auth(current: User = Depends(get_current_user)):
    if not settings.spotify_configured:
        raise HTTPException(503, "Spotify not configured — add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to .env")

    state = secrets.token_urlsafe(16)
    _oauth_states[state] = current.id
    return {"url": sp_svc.get_auth_url(state)}


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

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        return RedirectResponse(url=f"{fe}/connect?error=user_not_found")

    user.spotify_access_token  = data["access_token"]
    user.spotify_refresh_token = data.get("refresh_token")
    user.spotify_token_expires = sp_svc.token_expires_at(data["expires_in"])
    await db.commit()
    return RedirectResponse(url=f"{fe}/connect?spotify=connected")


@router.delete("/spotify")
async def disconnect_spotify(
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current.spotify_access_token  = None
    current.spotify_refresh_token = None
    current.spotify_token_expires = None
    await db.commit()
    return ConnectStatusResponse(platform="spotify", connected=False)


# ─── Yandex Music ─────────────────────────────────────────────────────────────

YANDEX_AUTH_URL = "https://oauth.yandex.com/authorize"


@router.get("/yandex/auth")
async def yandex_auth(current: User = Depends(get_current_user)):
    """
    Returns Yandex OAuth URL for implicit flow.
    Frontend opens this URL; after user authorizes, Yandex redirects to
    {frontend_url}/yandex-callback#access_token=TOKEN.
    Frontend reads the hash and POSTs to /api/connect/yandex.
    """
    if not settings.yandex_configured:
        raise HTTPException(
            503,
            "Yandex not configured — create app at oauth.yandex.com/client/new, "
            "add YANDEX_CLIENT_ID + YANDEX_CLIENT_SECRET + "
            "YANDEX_REDIRECT_URI to .env"
        )

    fe = settings.frontend_url.rstrip("/")
    params = {
        "response_type": "token",
        "client_id":     settings.yandex_client_id,
        "redirect_uri":  settings.yandex_redirect_uri or f"{fe}/yandex-callback",
        "force_confirm": "yes",
    }
    url = f"{YANDEX_AUTH_URL}?{urlencode(params)}"
    return {"url": url}


@router.post("/yandex")
async def connect_yandex(
    body: ConnectYandexRequest,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Validate and store a Yandex OAuth access_token."""
    info = await ym_svc.validate_token(body.token)
    if info is None:
        raise HTTPException(
            400,
            "Invalid Yandex Music token. "
            "Make sure you authorized via the OAuth flow and your account has Yandex Plus."
        )

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


# ─── Status ───────────────────────────────────────────────────────────────────

@router.get("/status")
async def connect_status(current: User = Depends(get_current_user)):
    return {
        "spotify": {
            "connected":          bool(current.spotify_access_token),
            "spotify_configured": settings.spotify_configured,
        },
        "yandex": {
            "connected":          bool(current.yandex_token),
            "yandex_configured":  settings.yandex_configured,
        },
    }
