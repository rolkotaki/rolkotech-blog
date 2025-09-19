from pathlib import Path
from pydantic import EmailStr, AnyUrl, BeforeValidator, PostgresDsn, computed_field
from pydantic_core import MultiHostUrl
from pydantic_settings import BaseSettings, SettingsConfigDict
import secrets
from typing import Literal, Annotated, Any


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",") if i.strip()]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Use top level .env file (one level above ./backend/)
        env_file="../.env",
        env_ignore_empty=True,
        extra="ignore",
    )

    PROJECT_NAME: str = "RolkoTech Blog"
    API_PROJECT_NAME: str = "RolkoTech Blog API"
    API_VERSION_STR: str = "/api"

    ENVIRONMENT: Literal["local", "production"] = "local"
    DEBUG: bool = False
    TEST_MODE: bool = False

    FRONTEND_HOST: str
    BACKEND_HOST: str

    # CORS settings
    BACKEND_CORS_ORIGINS: Annotated[
        list[AnyUrl] | str, BeforeValidator(parse_cors)
    ] = []

    @computed_field
    @property
    def all_cors_origins(self) -> list[str]:
        return [
            str(origin).rstrip("/")
            for origin in self.BACKEND_CORS_ORIGINS + [self.FRONTEND_HOST]
        ]

    POSTGRES_SERVER: str
    POSTGRES_PORT: int
    POSTGRES_DB: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str

    @computed_field
    @property
    def DATABASE_URL(self) -> PostgresDsn:
        return MultiHostUrl.build(
            scheme="postgresql+psycopg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_DB,
        )

    @computed_field
    @property
    def POSTGRES_TEST_DB(self) -> str:
        return f"{self.POSTGRES_DB}_test"

    @computed_field
    @property
    def TEST_DATABASE_URL(self) -> PostgresDsn:
        return MultiHostUrl.build(
            scheme="postgresql+psycopg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            path=self.POSTGRES_TEST_DB,
        )

    FIRST_SUPERUSER: str
    FIRST_SUPERUSER_EMAIL: EmailStr
    FIRST_SUPERUSER_PASSWORD: str
    TEST_USER: str
    TEST_USER_EMAIL: EmailStr
    TEST_USER_PASSWORD: str
    TEST_PLAYWRIGHT_USER: str
    TEST_PLAYWRIGHT_USER_EMAIL: EmailStr
    TEST_PLAYWRIGHT_USER_PASSWORD: str

    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 1 week

    MAILERSEND_API_KEY: str
    EMAIL_FROM: EmailStr
    EMAIL_FROM_NAME: str = "RolkoTech Blog"
    EMAIL_TOKEN_EXPIRE_HOURS: int = 24  # 1 day

    STATIC_UPLOAD_DIR: Path = Path(__file__).parent.parent.parent / "uploads"
    BLOGPOST_IMAGE_UPLOAD_DIR: Path = Path("images/blogposts")
    ALLOWED_EXTENSIONS: set[str] = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    MAX_FILE_SIZE: int = 5 * 1024 * 1024  # 5MB


settings = Settings()
