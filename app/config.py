from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Anthropic
    anthropic_api_key: str
    curator_model: str = "claude-haiku-4-5-20251001"

    # Google / YouTube
    google_client_id: str
    google_client_secret: str
    google_oauth_redirect: str = "http://localhost:8000/oauth/youtube/callback"
    youtube_refresh_token: str | None = None

    # Cognito
    cognito_region: str = "eu-central-1"
    cognito_user_pool_id: str = ""
    cognito_app_client_id: str = ""

    # Access control
    allowed_emails: str = ""

    # App
    target_region: str = "IL"
    db_path: str = "./wod2beats.db"

    @property
    def allowed_email_set(self) -> set[str]:
        return {e.strip().lower() for e in self.allowed_emails.split(",") if e.strip()}


settings = Settings()
