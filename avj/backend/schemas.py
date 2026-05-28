from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, field_validator


Platform = Literal["spotify", "yandex"]


# ─── Auth ─────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    handle: str
    email: EmailStr
    password: str
    city: str = "Toshkent"

    @field_validator("handle")
    @classmethod
    def clean_handle(cls, v: str) -> str:
        return v.lstrip("@").lower().strip()

    @field_validator("password")
    @classmethod
    def check_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ─── Listening ────────────────────────────────────────────────

class NowPlaying(BaseModel):
    song: str
    artist: str
    album: str
    platform: Platform


class ListeningEventOut(BaseModel):
    id: str
    song: str
    artist: str
    album: str
    platform: str
    started_at: datetime

    model_config = {"from_attributes": True}


# ─── User ─────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: str
    name: str
    handle: str
    email: str
    city: str
    visible: bool
    spotify: bool
    yandex: bool
    friend_count: int = 0
    track_count: int = 0
    now: NowPlaying | None = None
    profile_visibility: dict | None = None

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    name: str | None = None
    city: str | None = None
    visible: bool | None = None
    show_top_songs: bool | None = None
    show_top_artists: bool | None = None
    show_recent_played: bool | None = None
    show_activity: bool | None = None


class ProfileVisibility(BaseModel):
    show_top_songs: bool = True
    show_top_artists: bool = True
    show_recent_played: bool = True
    show_activity: bool = True


class InsightSong(BaseModel):
    song: str
    artist: str
    album: str = ""
    play_count: int = 0
    platform: str | None = None


class InsightArtist(BaseModel):
    artist: str
    play_count: int = 0


class ActivityDay(BaseModel):
    date: str
    plays: int


class ProfileInsightsResponse(BaseModel):
    has_data: bool
    has_fallback: bool
    fallback_note: str | None = None
    recent_played: dict | None = None
    top_songs: list[InsightSong] = []
    top_artists: list[InsightArtist] = []
    activity: dict


# ─── Friends ──────────────────────────────────────────────────

class FriendOut(BaseModel):
    id: str
    name: str
    handle: str
    platform: Platform | None = None
    status: Literal["live", "past"]
    ago: str
    mins: str | None = None
    song: str | None = None
    artist: str | None = None
    album: str | None = None
    spotify: bool
    yandex: bool
    recent: list[ListeningEventOut] = []

    model_config = {"from_attributes": True}


class SuggestionOut(BaseModel):
    id: str
    name: str
    handle: str
    mutual: int = 0
    source: str = "Avj"

    model_config = {"from_attributes": True}


# ─── Connect ──────────────────────────────────────────────────

class ConnectYandexRequest(BaseModel):
    token: str


class YandexDevicePollRequest(BaseModel):
    device_code: str


class ConnectStatusResponse(BaseModel):
    platform: str
    connected: bool
    redirect_url: str | None = None
