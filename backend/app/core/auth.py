from fastapi import Header, HTTPException, status
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials

from .config import get_settings

_firebase_app: firebase_admin.App | None = None

DEV_USER_ID = "dev-local-user"


def _get_firebase_app() -> firebase_admin.App:
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app
    settings = get_settings()
    _firebase_app = firebase_admin.initialize_app(credentials.ApplicationDefault())
    return _firebase_app


async def get_current_user_id(authorization: str = Header(default="")) -> str:
    """
    FastAPI dependency that returns the authenticated user's uid.

    DEV MODE (FIREBASE_PROJECT_ID not set):
      Skips token verification entirely and returns a fixed dev uid.
      This lets you use the AI assistant locally without a Firebase project.
      Never deploy to production without setting FIREBASE_PROJECT_ID.

    PRODUCTION MODE (FIREBASE_PROJECT_ID set):
      Verifies the Firebase ID token sent in the Authorization header.
    """
    settings = get_settings()

    if settings.dev_mode:
        # No Firebase configured — accept any request in dev mode.
        return DEV_USER_ID

    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header.",
        )

    id_token = authorization.removeprefix("Bearer ").strip()
    try:
        app = _get_firebase_app()
        decoded = firebase_auth.verify_id_token(id_token, app=app)
        return decoded["uid"]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
        )
