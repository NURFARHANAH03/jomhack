"""GET /me: who am I? Used to test login, and later by the frontend to check the session."""
from fastapi import APIRouter, Depends

from kokoronal.dependencies import get_current_user
from kokoronal.schemas import CurrentUser

router = APIRouter(tags=["auth"])


@router.get("/me", response_model=CurrentUser)
def me(user: CurrentUser = Depends(get_current_user)):
    print("DEBUG [router] GET /me | user:", user.id)   # remove before deploy
    return user