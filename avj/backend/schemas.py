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

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    name: str | None = None
    city: str | None = None
    visible: bool | None = None


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


class ConnectStatusResponse(BaseModel):
    platform: str
    connected: bool
    redirect_url: str | None = None
