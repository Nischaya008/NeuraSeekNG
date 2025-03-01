from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.search import router as search_router
from .config import settings

app = FastAPI(title="Neural Seek API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(search_router, prefix="/api") 