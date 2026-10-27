"""Vocabulary Router: AI-driven word generation and history tracking."""
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException, Query
from kokoronal.dependencies import get_optional_current_user

router = APIRouter(tags=["vocabulary"])

# Fallback dictionary for A-Z vocabulary words
VOCABULARY_DATA = {
    "A": {"word": "Amiable", "definition": "Having or displaying a friendly and pleasant manner.", "example": "She welcomed the guests with an amiable smile."},
    "B": {"word": "Benevolent", "definition": "Well meaning and kindly.", "example": "A benevolent smile lit up his face."},
    "C": {"word": "Clarity", "definition": "The quality of being clear, coherent, and intelligible.", "example": "Journaling brought clarity to her thoughts."},
    "D": {"word": "Delight", "definition": "Great pleasure or satisfaction.", "example": "Reading old memories brought immense delight."},
    "S": {"word": "Serendipity", "definition": "Finding valuable or agreeable things not sought for.", "example": "Writing brought a sense of serendipity to her evening."}
}

@router.get("/vocabulary")
def get_vocabulary(
    letter: Optional[str] = Query(None, description="Single letter from A to Z"),
    authorization: Optional[str] = Header(None),
    user=Depends(get_optional_current_user)
):
    # Normalize and validate the letter parameter if provided
    cleaned_letter = "S"
    if letter:
        cleaned_letter = letter.strip().upper()
        if len(cleaned_letter) != 1 or not cleaned_letter.isalpha():
            raise HTTPException(
                status_code=422,
                detail="letter must be a single letter from A to Z"
            )

    # Fetch word matching the requested letter (or fallback to 'S')
    vocab_item = VOCABULARY_DATA.get(cleaned_letter, VOCABULARY_DATA["S"])

    return {
        "word": vocab_item["word"],
        "definition": vocab_item["definition"],
        "example": vocab_item["example"],
        "letter": cleaned_letter
    }