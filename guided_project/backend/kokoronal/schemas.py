"""Pydantic models = the shape of data going OUT of the API."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel

MOODS = {"Happy", "Sad", "Angry", "Tired"}


class Post(BaseModel):
    id: int
    title: str
    body: str
    image: Optional[str] = None
    mood: Optional[str] = None
    author_id: str
    created_at: datetime
    updated_at: datetime

class VocabAI(BaseModel):
    word: str
    part_of_speech: Optional[str] = None
    definition: str
    example: str

class Vocabulary(VocabAI):
    letter: Optional[str] = None
    source: Optional[str] = "ai"

class CurrentUser(BaseModel):
    """The logged-in user, taken from the Supabase token."""
    id: str
    email: Optional[str] = None