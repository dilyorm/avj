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
from schemas import ConnectYandexRequest, ConnectStatusResponse, YandexDevicePollRequest
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

# Yandex Music Android app credentials (public, used by yandex-music-api library)
_YM_CLIENT_ID     = "23cabbbdc6cd418abb4b39c32c41195d"
_YM_CLIENT_SECRET = "53bc75238f0c4d08a118e51fe9203300"


@router.post("/yandex/device")
async def yandex_device_init(current: User = Depends(get_current_user)):
    """
    Start Yandex device auth flow.
    Returns user_code (shown to user) + verification_url (user opens in browser) + device_code (for polling).
    """
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            "https://oauth.yandex.ru/device/code",
            data={"client_id": _YM_CLIENT_ID},
        )
    if resp.status_code != 200:
        raise HTTPException(503, f"Yandex device auth unavailable: {resp.text}")
    data = resp.json()
    return {
        "user_code":         data["user_code"],
        # verification_url_complete has the code pre-filled — user just clicks Allow
        "verification_url":  data.get("verification_url_complete") or data["verification_url"],
        "device_code":       data["device_code"],
        "expires_in":        data.get("expires_in", 300),
        "interval":          data.get("interval", 5),
    }


@router.post("/yandex/device/poll")
async def yandex_device_poll(
    body: YandexDevicePollRequest,
    current: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Poll for device auth completion.
    Returns {status: "pending" | "connected" | "expired" | "error"}.
    """
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(
            "https://oauth.yandex.ru/token",
            data={
                "grant_type":    "device_code",
                "code":          body.device_code,
                "client_id":     _YM_CLIENT_ID,
                "client_secret": _YM_CLIENT_SECRET,
            },
        )

    if resp.status_code == 400:
        error = resp.json().get("error", "")
        if error in ("authorization_pending", "slow_down"):
            return {"status": "pending"}
        if error == "expired_token":
            return {"status": "expired"}
        return {"status": "error", "detail": error}

    if resp.status_code != 200:
        raise HTTPException(502, f"Yandex token error: {resp.text}")

    token = resp.json().get("access_token")
    if not token:
        raise HTTPException(502, "No access_token in Yandex response")

    # Token came directly from Yandex OAuth — it's valid. Skip Music API validation
    # (validate_token can fail due to yandex-music library parse bugs; we trust OAuth)
    current.yandex_token = token
    await db.commit()
    return {"status": "connected"}


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


# ─── Debug ────────────────────────────────────────────────────────────────────

@router.get("/yandex/debug-track")
async def yandex_debug_track(current: User = Depends(get_current_user)):
    """Dev-only: run get_current_track and return raw result + any error."""
    if not current.yandex_token:
        return {"error": "no_token"}
    try:
        from yandex_music import ClientAsync as YMClient
        client = await YMClient(current.yandex_token).init()

        # Step 1: queues
        queues = await client.queues_list()
        if not queues:
            return {"step": "queues_list", "result": "empty", "queues": []}

        queues_info = [{"id": q.id, "modified": q.modified} for q in queues]
        latest = max(queues, key=lambda q: q.modified or "")

        # Step 2: full queue
        queue = await client.queue(latest.id)
        if queue is None:
            return {"step": "queue_fetch", "result": "None", "queues": queues_info}
        if queue.current_index is None:
            return {"step": "current_index", "result": "None", "queue_tracks_count": len(queue.tracks or [])}

        idx = queue.current_index
        tracks_count = len(queue.tracks or [])
        if not queue.tracks or idx >= tracks_count:
            return {"step": "track_index_out_of_range", "idx": idx, "tracks_count": tracks_count}

        track_short = queue.tracks[idx]
        track_id_str = (
            f"{track_short.id}:{track_short.album_id}"
            if hasattr(track_short, "album_id") and track_short.album_id
            else str(track_short.id)
        )

        # Step 3: full track
        tracks = await client.tracks([track_id_str])
        if not tracks:
            return {"step": "tracks_fetch", "result": "empty", "track_id": track_id_str}

        track = tracks[0]
        return {
            "step": "success",
            "song":    track.title,
            "artist":  ", ".join(a.name for a in (track.artists or [])),
            "album":   track.albums[0].title if track.albums else "",
            "queues":  queues_info,
            "current_index": idx,
            "track_id": track_id_str,
        }
    except Exception as e:
        import traceback
        return {"step": "exception", "error": str(e), "traceback": traceback.format_exc()}


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
