from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    allowed_origins: list[str] = ["*"]

    # When FIREBASE_PROJECT_ID is empty, the backend runs in DEV mode:
    # auth checks are skipped so you can test the AI assistant without
    # needing a Firebase project. Set this in production to enforce auth.
    firebase_project_id: str = ""

    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-120b"

    @property
    def dev_mode(self) -> bool:
        """True when Firebase is not configured — skips token verification."""
        return not bool(self.firebase_project_id)


@lru_cache
def get_settings() -> Settings:
    return Settings()
