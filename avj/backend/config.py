from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # JWT
    secret_key: str = "dev-secret-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 days

    # Database
    database_url: str = "postgresql+asyncpg://avj:avj@localhost:5432/avj"

    # Spotify OAuth
    spotify_client_id: str = ""
    spotify_client_secret: str = ""
    spotify_redirect_uri: str = "http://localhost:8000/api/connect/spotify/callback"

    # Yandex OAuth (create app at https://oauth.yandex.com/client/new)
    # Platform: Web services
    # Callback URI: https://avj.dilyor.dev/yandex-callback  (and http://localhost:5173/yandex-callback for dev)
    # Permissions: login:info
    yandex_client_id: str = ""
    yandex_client_secret: str = ""
    yandex_redirect_uri: str = "http://localhost:5173/yandex-callback"

    # Background poller
    poll_interval: int = 30

    # CORS
    cors_origins: str = "http://localhost:5173,http://localhost:4173"

    # Frontend URL (used in OAuth redirects)
    frontend_url: str = "http://localhost:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def spotify_configured(self) -> bool:
        return bool(self.spotify_client_id and self.spotify_client_secret)

    @property
    def yandex_configured(self) -> bool:
        return bool(self.yandex_client_id and self.yandex_client_secret)


@lru_cache
def get_settings() -> Settings:
    return Settings()
