import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean, DateTime, ForeignKey, String, Text, UniqueConstraint, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String(100))
    handle: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(200))
    city: Mapped[str] = mapped_column(String(100), default="Toshkent")
    visible: Mapped[bool] = mapped_column(Boolean, default=True)
    show_top_songs: Mapped[bool] = mapped_column(Boolean, default=True)
    show_top_artists: Mapped[bool] = mapped_column(Boolean, default=True)
    show_recent_played: Mapped[bool] = mapped_column(Boolean, default=True)
    show_activity: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Spotify
    spotify_access_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    spotify_refresh_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    spotify_token_expires: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Yandex Music
    yandex_token: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Cached "now playing" (updated by poller)
    now_song: Mapped[str | None] = mapped_column(String(300), nullable=True)
    now_artist: Mapped[str | None] = mapped_column(String(300), nullable=True)
    now_album: Mapped[str | None] = mapped_column(String(300), nullable=True)
    now_platform: Mapped[str | None] = mapped_column(String(20), nullable=True)
    now_updated: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    # Relationships
    friendships_sent: Mapped[list["Friendship"]] = relationship(
        "Friendship", foreign_keys="Friendship.user_id", back_populates="user", lazy="selectin"
    )
    friendships_received: Mapped[list["Friendship"]] = relationship(
        "Friendship", foreign_keys="Friendship.friend_id", back_populates="friend", lazy="selectin"
    )
    events: Mapped[list["ListeningEvent"]] = relationship(
        "ListeningEvent", back_populates="user", lazy="selectin", order_by="ListeningEvent.started_at.desc()"
    )

    @property
    def is_live(self) -> bool:
        """True if updated in the last 4 minutes (one poll cycle + buffer)."""
        if not self.now_updated or not self.now_song:
            return False
        delta = (datetime.utcnow() - self.now_updated).total_seconds()
        return delta < 240


class Friendship(Base):
    __tablename__ = "friendships"
    __table_args__ = (UniqueConstraint("user_id", "friend_id", name="uq_friendship"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    friend_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    # pending → accepted
    status: Mapped[str] = mapped_column(String(20), default="accepted")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship("User", foreign_keys=[user_id], back_populates="friendships_sent")
    friend: Mapped["User"] = relationship("User", foreign_keys=[friend_id], back_populates="friendships_received")


class ListeningEvent(Base):
    """History of what a user has listened to — written each time the poller detects a new track."""
    __tablename__ = "listening_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    song: Mapped[str] = mapped_column(String(300))
    artist: Mapped[str] = mapped_column(String(300))
    album: Mapped[str] = mapped_column(String(300))
    platform: Mapped[str] = mapped_column(String(20))
    started_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="events")
