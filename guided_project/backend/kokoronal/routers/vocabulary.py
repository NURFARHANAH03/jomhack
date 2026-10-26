"""HTTP layer for the vocabulary reward."""
from typing import Optional

from fastapi import APIRouter, Depends

from kokoronal.dependencies import get_vocabulary_service
from kokoronal.schemas import Vocabulary
from kokoronal.services.vocabulary_service import VocabularyService

router = APIRouter(prefix="/vocabulary", tags=["vocabulary"])


# GET /vocabulary?letter=A&author_id=ada
# Call this right after POST /posts returns 201 (or when the user picks a letter).
# letter is optional (random if missing). Gemini can take a few seconds,
# so the frontend should show a loading state.
@router.get("", response_model=Vocabulary)
def get_vocabulary(
    letter: Optional[str] = None,
    author_id: Optional[str] = None,
    service: VocabularyService = Depends(get_vocabulary_service),
):
    return service.get_word(letter, author_id)

