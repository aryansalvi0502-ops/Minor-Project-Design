import json
import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Student Success Early-Warning System"
    ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"

    SECRET_KEY: str = "development-only-insecure-secret-key-change-in-production-min-32-chars-long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    DATABASE_URL: str = "sqlite:///./early_warning.db"

    MODEL_ARTIFACTS_DIR: str = "ml/artifacts"
    DEFAULT_LOW_THRESHOLD: float = 30.0
    DEFAULT_MEDIUM_THRESHOLD: float = 60.0

    # Authorized frontend origins - including the production Vercel deployment
    CORS_ORIGINS: List[str] = [
        "https://minor-project-design.vercel.app",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ]
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str], None]) -> List[str]:
        if not v:
            return [
                "https://minor-project-design.vercel.app",
                "http://localhost:5173",
                "http://127.0.0.1:5173"
            ]
        if isinstance(v, str):
            v_stripped = v.strip()
            if v_stripped.startswith("[") and v_stripped.endswith("]"):
                try:
                    parsed = json.loads(v_stripped)
                    if isinstance(parsed, list):
                        return [str(o).strip().rstrip("/") for o in parsed if str(o).strip()]
                except Exception:
                    pass
            # Comma-separated list
            origins = [part.strip().rstrip("/") for part in v_stripped.split(",") if part.strip()]
            return origins
        elif isinstance(v, list):
            return [str(o).strip().rstrip("/") for o in v if str(o).strip()]
        return v

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Union[str, None]) -> str:
        if not v:
            return "sqlite:///./early_warning.db"
        val = str(v).strip()
        # SQLAlchemy 2.0 requires postgresql:// instead of postgres:// (common in Render / Supabase / Neon)
        if val.startswith("postgres://"):
            val = val.replace("postgres://", "postgresql://", 1)
        return val

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

