from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite+aiosqlite:///./resource.db"
    secret_key: str = "dev-secret-change-me-in-production-please-32b"
    access_token_expire_minutes: int = 60 * 24 * 7
    refresh_token_expire_days: int = 30
    algorithm: str = "HS256"
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "https://whatislav.online,https://www.whatislav.online,"
        "https://ragozina-ta.github.io"
    )
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4o-mini"
    vapid_private_key: str = ""
    vapid_public_key: str = ""
    vapid_mailto: str = "mailto:admin@resource.app"
    frontend_base_url: str = "https://whatislav.online"

    @field_validator("vapid_private_key", mode="before")
    @classmethod
    def normalize_vapid_private(cls, v: object) -> str:
        if not v:
            return ""
        s = str(v).strip().strip('"').strip("'")
        # Keep PEM file paths as paths — pywebpush uses Vapid.from_file().
        # Only normalize inline PEM / raw keys.
        path = Path(s)
        if s.endswith(".pem") or (s.startswith("/") and path.is_file()):
            return str(path)
        return s.replace("\\n", "\n")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
