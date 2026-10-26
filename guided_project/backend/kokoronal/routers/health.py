"""Health check: is the server running?"""
from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/")
@router.get("/health")
def health():
    return {"ok": True, "app": "Kokoronal Journal API"}
