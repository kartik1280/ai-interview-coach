import os
from typing import Optional

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore")

    # Supabase
    supabase_url: str = os.getenv(
        "SUPABASE_URL",
        "https://fiyyiepsdiutloqvonpz.supabase.co",
    )
    supabase_service_role_key: str = os.getenv(
        "SUPABASE_SERVICE_ROLE_KEY",
        "",
    )

    # AI Providers
    gemini_api_key: Optional[str] = os.getenv(
        "GEMINI_API_KEY",
        None,
    )
    groq_api_key: Optional[str] = os.getenv(
        "GROQ_API_KEY",
        None,
    )

    # Voice Provider
    elevenlabs_api_key: Optional[str] = os.getenv(
        "ELEVENLABS_API_KEY",
        None,
    )
    elevenlabs_voice_id: Optional[str] = os.getenv(
        "ELEVENLABS_VOICE_ID",
        None,
    )

    # Server
    port: int = int(os.getenv("PORT", 3000))


settings = Settings()
