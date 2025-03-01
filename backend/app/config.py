from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GOOGLE_API_KEY: str
    GOOGLE_CX_ID: str
    YOUTUBE_API_KEY: str
    REDDIT_CLIENT_ID: str
    REDDIT_CLIENT_SECRET: str
    REDDIT_USER_AGENT: str = "NeuralSeekNG/1.0"
    CORS_ORIGINS: str = "http://localhost:5173,https://neuraseekng.vercel.app"
    SERPAPI_KEY: str
    HUGGINGFACE_API_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()
