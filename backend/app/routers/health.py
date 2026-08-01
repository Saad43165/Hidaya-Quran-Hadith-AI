from fastapi import APIRouter
from ..core.config import get_settings

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    settings = get_settings()
    return {
        "status": "ok",
        "mode": "development" if settings.dev_mode else "production",
        "firebase_configured": not settings.dev_mode,
        "groq_configured": bool(settings.groq_api_key),
        "model": settings.groq_model,
    }
