"""Dependency providers: how FastAPI builds the objects a route needs.

A route asks for `service: PostService = Depends(get_post_service)` and
FastAPI builds the chain for it:
    Supabase client -> PostRepository + MediaService -> PostService
In tests you can swap any of these for a fake version.
"""
from fastapi import Depends

from kokoronal.clients import get_gemini_client, get_supabase_client
from kokoronal.config import settings
from kokoronal.database import PostRepository
from kokoronal.services.media_service import MediaService
from kokoronal.services.post_service import PostService
from kokoronal.services.vocabulary_service import VocabularyService
from kokoronal.vocabulary_repository import VocabularyRepository


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
