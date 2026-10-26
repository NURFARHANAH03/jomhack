"""HTTP layer for the vocabulary reward."""
from typing import Optional
from fastapi import APIRouter, Depends
from kokoronal.dependencies import get_optional_current_user, get_vocabulary_service
from kokoronal.schemas import CurrentUser, Vocabulary
from kokoronal.services.vocabulary_service import VocabularyService

router = APIRouter(prefix="/vocabulary", tags=["vocabulary"])

@router.get("", response_model=Vocabulary)
def get_vocabulary(
    letter: Optional[str] = None,
    user: Optional[CurrentUser] = Depends(get_optional_current_user),
    service: VocabularyService = Depends(get_vocabulary_service),
):
    user_id = user.id if user else "guest"
    # Change get_vocabulary to get_word (or whichever method is defined in VocabularyService)
    return service.get_word(user_id, letter)