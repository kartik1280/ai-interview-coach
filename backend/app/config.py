from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    supabase_url: str = "https://fiyyiepsdiutloqvonpz.supabase.co"
    supabase_service_role_key: str = "sb_publishable__8wmK3kcAvAo3foaI-6fDQ_nCvNdViE"
    openai_api_key: Optional[str] = None
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
