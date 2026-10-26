"""Settings loaded from the .env file (pydantic-settings)."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Supabase (required)
    supabase_url: str
    supabase_service_role_key: str
    supabase_bucket: str = "journal-media"

    # Frontend origin(s) allowed by CORS, comma-separated
    frontend_origin: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Used when the frontend doesn't send an author_id
    default_author_id: str = "ada"

    max_upload_mb: int = 50

    # Google AI Studio (optional) - powers the vocabulary reward.
    # If missing or failing, a built-in word list is used instead.
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-3.5-flash"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
