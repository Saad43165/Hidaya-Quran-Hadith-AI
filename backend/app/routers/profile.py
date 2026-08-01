from fastapi import APIRouter, Depends

from ..core.auth import get_current_user_id

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me")
async def get_my_profile(uid: str = Depends(get_current_user_id)):
    """
    Protected route: returns the authenticated user's Firebase uid.
    This is the real, working proof that ID-token verification is wired
    correctly end-to-end (Expo app -> FastAPI -> Firebase Admin SDK).
    Extend this with real profile data (reading progress, preferences,
    etc.) once you add a database in a later phase.
    """
    return {"uid": uid}
