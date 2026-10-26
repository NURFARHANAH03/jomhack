"""Connections to outside services (Supabase, Gemini).

Each client is created once and reused (lru_cache), not on every request.
"""
from functools import lru_cache

from google import genai
from supabase import Client, create_client

from kokoronal.config import settings


@lru_cache
def get_supabase_client() -> Client:
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


@lru_cache
def get_gemini_client() -> genai.Client | None:
    """Returns None when no GEMINI_API_KEY is set (fallback words are used)."""
    if not settings.gemini_api_key:
        return None
    return genai.Client(api_key=settings.gemini_api_key)
