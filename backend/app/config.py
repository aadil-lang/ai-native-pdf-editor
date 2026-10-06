import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

class Settings(BaseModel):
    PROJECT_NAME: str = "PaperForge API"
    DATA_DIR: Path = DATA_DIR
    DATABASE_URL: str = f"sqlite:///{DATA_DIR / 'paperforge.db'}"
    
    # AI Settings
    DEFAULT_AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini") # "gemini" or "ollama"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:7b-instruct")

settings = Settings()
