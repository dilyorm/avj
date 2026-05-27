"""
Spotify API integration.
- OAuth PKCE-less flow (Authorization Code)
- Token refresh
- Currently-playing polling
"""
from __future__ import annotations

import base64
import logging
from datetime import datetime, timedelta
from urllib.parse import urlencode

import httpx

from config import get_settings

log = logging.getLogger("avj.spotify")
settings = get_settings()

SCOPES = "user-read-currently-playing user-read-playback-state user-read-recently-played"

AUTH_URL    = "https://accounts.spotify.com/authorize"
TOKEN_URL   = "https://accounts.spotify.com/api/token"
API_BASE    = "https://api.spotify.com/v1"


def get_auth_url(state: str) -> str:
    params = {
        "client_id":     settings.spotify_client_id,
        "response_type": "code",
        "redirect_uri":  settings.spotify_redirect_uri,
        "scope":         SCOPES,
        "state":         state,
    }
    return f"{AUTH_URL}?{urlencode(params)}"


def _b64_creds() -> str:
    creds = f"{settings.spotify_client_id}:{settings.spotify_client_secret}"
    return base64.b64encode(creds.encode()).decode()


async def exchange_code(code: str) -> dict:
    """Exchange auth code for access + refresh tokens."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            TOKEN_URL,
            headers={"Authorization": f"Basic {_b64_creds()}"},
            data={
                "grant_type":   "authorization_code",
                "code":         code,
                "redirect_uri": settings.spotify_redirect_uri,
            },
        )
        resp.raise_for_status()
        return resp.json()


async def refresh_token(refresh: str) -> dict:
    """Get a fresh access token using the refresh token."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            TOKEN_URL,
            headers={"Authorization": f"Basic {_b64_creds()}"},
            data={
                "grant_type":    "refresh_token",
                "refresh_token": refresh,
            },
        )
        resp.raise_for_status()
        return resp.json()


async def get_current_track(access_token: str) -> dict | None:
    """
    Returns dict with song/artist/album/platform or None if nothing playing.
    Raises httpx.HTTPStatusError on auth errors (caller should refresh).
    """
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{API_BASE}/me/player/currently-playing",
            headers={"Authorization": f"Bearer {access_token}"},
        )

    # 204 = nothing playing / private session
    if resp.status_code == 204:
        return None

    resp.raise_for_status()

    data = resp.json()
    if not data or data.get("currently_playing_type") != "track":
        return None

    item = data.get("item")
    if not item:
        return None

    progress_ms = data.get("progress_ms", 0)
    duration_ms = item.get("duration_ms", 0)

    def ms_to_min(ms: int) -> str:
        s = ms // 1000
        return f"{s // 60}:{s % 60:02d}"

    return {
        "song":     item["name"],
        "artist":   ", ".join(a["name"] for a in item["artists"]),
        "album":    item["album"]["name"],
        "platform": "spotify",
        "mins":     f"{ms_to_min(progress_ms)} / {ms_to_min(duration_ms)}",
        "is_playing": data.get("is_playing", False),
    }


async def get_recently_played(access_token: str, limit: int = 5) -> list[dict]:
    """Get recently played tracks for history."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{API_BASE}/me/player/recently-played?limit={limit}",
            headers={"Authorization": f"Bearer {access_token}"},
        )
    if resp.status_code != 200:
        return []
    items = resp.json().get("items", [])
    result = []
    for item in items:
        track = item.get("track", {})
        result.append({
            "song":     track.get("name", ""),
            "artist":   ", ".join(a["name"] for a in track.get("artists", [])),
            "album":    track["album"]["name"] if track.get("album") else "",
            "platform": "spotify",
            "played_at": item.get("played_at", ""),
        })
    return result


def token_expires_at(expires_in: int) -> datetime:
    """Given expires_in seconds, return the expiry datetime with 60s buffer."""
    return datetime.utcnow() + timedelta(seconds=expires_in - 60)
