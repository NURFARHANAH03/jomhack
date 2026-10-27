"""Dependency providers: how FastAPI builds the objects a route needs.

A route asks for `service: PostService = Depends(get_post_service)` and
FastAPI builds the chain for it:
    Supabase client -> PostRepository + MediaService -> PostService
In tests you can swap any of these for a fake version.
"""
from typing import Optional

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
...
from kokoronal.schemas import CurrentUser
from kokoronal.clients import get_gemini_client, get_supabase_client
from kokoronal.config import settings
from kokoronal.database import PostRepository
from kokoronal.services.media_service import MediaService
from kokoronal.services.post_service import PostService
from kokoronal.services.vocabulary_service import VocabularyService
from kokoronal.vocabulary_repository import VocabularyRepository
from typing import Optional
from fastapi import Header

async def get_optional_current_user(
    authorization: Optional[str] = Header(None),
    supabase = Depends(get_supabase_client)
) -> Optional[CurrentUser]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ")[1]
    try:
        res = supabase.auth.get_user(token)
        if res and res.user:
            return CurrentUser(id=res.user.id, email=res.user.email)
    except Exception:
        return None
    return None

def get_post_repository() -> PostRepository:
    return PostRepository(get_supabase_client())


def get_media_service() -> MediaService:
    return MediaService(
        get_supabase_client(), settings.supabase_bucket, settings.max_upload_mb
    )


def get_post_service(
    posts: PostRepository = Depends(get_post_repository),
    media: MediaService = Depends(get_media_service),
) -> PostService:
    return PostService(posts, media, settings.default_author_id)


def get_vocabulary_repository() -> VocabularyRepository:
    return VocabularyRepository(get_supabase_client())


def get_vocabulary_service(
    history: VocabularyRepository = Depends(get_vocabulary_repository),
) -> VocabularyService:
    return VocabularyService(
        get_gemini_client(), settings.gemini_model, history, settings.default_author_id
    )

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> CurrentUser:
    """Read 'Authorization: Bearer <token>' and ask Supabase who the token belongs to."""
    unauthorized = {"WWW-Authenticate": "Bearer"}
    if credentials is None:
        raise HTTPException(401, "Not logged in", headers=unauthorized)

    try:
        result = get_supabase_client().auth.get_user(credentials.credentials)
    except Exception as exc:  # expired, malformed or revoked token
        raise HTTPException(401, "Invalid or expired token", headers=unauthorized)

    user = result.user if result else None
    if user is None:
        raise HTTPException(401, "Invalid or expired token", headers=unauthorized)

    return CurrentUser(id=str(user.id), email=user.email)