from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    DATABASE_URL: str

    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    PASSWORD_RESET_EXPIRE_MINUTES: int = 60

    FRONTEND_URL: str = "http://localhost:5173"

    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@cybrella.io"

    INITIAL_ADMIN_EMAIL: str = "lianc@cybrella.io"

    DEFAULT_TIMEZONE: str = "Asia/Jerusalem"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
