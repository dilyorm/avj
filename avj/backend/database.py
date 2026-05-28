from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=False,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


class Base(DeclarativeBase):
    pass


async def init_db() -> None:
    """Create all tables on startup."""
    async with engine.begin() as conn:
        from models import User, Friendship, ListeningEvent  # noqa: F401
        await conn.run_sync(Base.metadata.create_all)
        # Lightweight compatibility migrations for existing deployments.
        await conn.exec_driver_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS show_top_songs BOOLEAN DEFAULT TRUE")
        await conn.exec_driver_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS show_top_artists BOOLEAN DEFAULT TRUE")
        await conn.exec_driver_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS show_recent_played BOOLEAN DEFAULT TRUE")
        await conn.exec_driver_sql("ALTER TABLE users ADD COLUMN IF NOT EXISTS show_activity BOOLEAN DEFAULT TRUE")


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
