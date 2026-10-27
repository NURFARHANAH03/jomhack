"""Vocabulary Router: Gemini-generated words by letter, with a built-in fallback list."""
import json
import logging
import random
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query

from kokoronal.config import settings  # adjust if config.py lives elsewhere
from kokoronal.dependencies import get_optional_current_user

router = APIRouter(tags=["vocabulary"])
logger = logging.getLogger(__name__)

AI_ATTEMPTS = 2


def w(word, pos, definition, example):
    return {"word": word, "part_of_speech": pos, "definition": definition, "example": example}


# Fallback words, used only when Gemini fails or returns a bad word.
VOCABULARY_DATA = {
    "A": [
        w("Amiable", "adjective", "Having or displaying a friendly and pleasant manner.", "She welcomed the guests with an amiable smile."),
        w("Astral", "adjective", "Relating to or resembling the stars.", "The clear night sky felt almost astral."),
    ],
    "B": [
        w("Benevolent", "adjective", "Well meaning and kindly.", "A benevolent smile lit up his face."),
        w("Blissful", "adjective", "Extremely happy; full of joy.", "Morning reflection led to a blissful start."),
    ],
    "C": [
        w("Clarity", "noun", "The quality of being clear, coherent, and intelligible.", "Journaling brought clarity to her thoughts."),
        w("Candid", "adjective", "Truthful and straightforward; frank.", "He wrote a candid entry about his worries."),
    ],
    "D": [
        w("Delight", "noun", "Great pleasure or satisfaction.", "Reading old memories brought immense delight."),
        w("Discernment", "noun", "The ability to judge well.", "Reflection sharpened her discernment."),
    ],
    "E": [
        w("Ephemeral", "adjective", "Lasting for a very short time.", "The morning mist was beautiful but ephemeral."),
        w("Empathy", "noun", "The ability to understand and share the feelings of another.", "Writing about her day deepened her empathy."),
    ],
    "F": [
        w("Flourish", "verb", "Grow or develop in a healthy or vigorous way.", "With daily reflection, peace begins to flourish."),
        w("Fortitude", "noun", "Courage in pain or adversity.", "She faced the week with quiet fortitude."),
    ],
    "G": [
        w("Gratitude", "noun", "The quality of being thankful.", "She wrote three things she felt gratitude for."),
        w("Genuine", "adjective", "Truly what it is said to be; sincere.", "His genuine joy was easy to see."),
    ],
    "H": [
        w("Harmony", "noun", "A pleasing arrangement or agreement of parts.", "Mindfulness brings harmony to daily routines."),
        w("Hopeful", "adjective", "Feeling or inspiring optimism about the future.", "She felt hopeful after writing it all down."),
    ],
    "I": [
        w("Insight", "noun", "The capacity to gain deep intuitive understanding.", "The prompt offered a new insight into her goals."),
        w("Introspection", "noun", "The examination of one's own thoughts and feelings.", "Evenings are her time for introspection."),
    ],
    "J": [
        w("Jubilant", "adjective", "Feeling or expressing great happiness and triumph.", "The team was jubilant after completing the project."),
        w("Joyful", "adjective", "Feeling, expressing, or causing great happiness.", "The joyful memory made her smile."),
    ],
    "K": [
        w("Kindred", "adjective", "Similar in kind; related.", "They found kindred spirits in the book club."),
        w("Keen", "adjective", "Having or showing eagerness or sharpness.", "He took a keen interest in his own growth."),
    ],
    "L": [
        w("Luminous", "adjective", "Full of or shedding light; bright or shining.", "The evening light gave the room a luminous glow."),
        w("Lucid", "adjective", "Clearly expressed; easy to understand.", "Her lucid writing surprised even her."),
    ],
    "M": [
        w("Mindful", "adjective", "Consciously aware and present in the moment.", "Taking a mindful pause helps calm a busy day."),
        w("Melancholy", "noun", "A gentle, thoughtful sadness.", "A soft melancholy settled over the rainy afternoon."),
    ],
    "N": [
        w("Nurture", "verb", "Care for and encourage the growth of.", "Journaling is a peaceful way to nurture creativity."),
        w("Nostalgia", "noun", "A sentimental longing for the past.", "Old photos filled her with nostalgia."),
    ],
    "O": [
        w("Optimistic", "adjective", "Hopeful about the future.", "He felt optimistic about the upcoming projects."),
        w("Openness", "noun", "Willingness to consider new ideas or feelings.", "Honest writing starts with openness."),
    ],
    "P": [
        w("Perseverance", "noun", "Persistence in doing something despite difficulty.", "Her perseverance paid off in the end."),
        w("Pensive", "adjective", "Engaged in deep or serious thought.", "He sat pensive by the window."),
    ],
    "Q": [
        w("Quaint", "adjective", "Attractively unusual or old-fashioned.", "They stayed in a quaint little village."),
        w("Quiescent", "adjective", "In a state of quiet rest; inactive.", "The garden lay quiescent through the winter."),
    ],
    "R": [
        w("Resilience", "noun", "The capacity to recover quickly from difficulties.", "Writing helps build emotional resilience."),
        w("Reflect", "verb", "Think deeply or carefully about something.", "She likes to reflect on her day before bed."),
    ],
    "S": [
        w("Serendipity", "noun", "Finding valuable or agreeable things not sought for.", "Writing brought a sense of serendipity to her evening."),
        w("Serene", "adjective", "Calm, peaceful, and untroubled.", "The lake looked serene at dawn."),
    ],
    "T": [
        w("Tranquility", "noun", "The quality or state of being calm.", "A quiet morning brings pure tranquility."),
        w("Thrive", "verb", "Grow or develop well and vigorously.", "Small habits help us thrive."),
    ],
    "U": [
        w("Uplift", "verb", "Elevate or inspire mentally or emotionally.", "Positive thoughts uplift the mind."),
        w("Unwavering", "adjective", "Steady and firm; not changing or doubting.", "Her unwavering habit of journaling kept her grounded."),
    ],
    "V": [
        w("Vibrant", "adjective", "Full of energy and enthusiasm.", "The journal entry was full of vibrant details."),
        w("Venture", "noun", "A new and somewhat risky undertaking.", "Starting a journal was a gentle venture into self-discovery."),
    ],
    "W": [
        w("Wisdom", "noun", "The quality of having experience, knowledge, and good judgment.", "Reflection is the path to personal wisdom."),
        w("Wistful", "adjective", "Having a feeling of vague, gentle longing.", "She gave a wistful smile at the old letter."),
    ],
    "X": [
        w("Xenial", "adjective", "Hospitable, warm, and welcoming to strangers.", "Her xenial nature made everyone feel at home."),
        w("Xenodochial", "adjective", "Friendly to strangers.", "The xenodochial innkeeper greeted every traveler."),
    ],
    "Y": [
        w("Yearning", "noun", "A feeling of intense longing for something.", "A gentle yearning for peace filled the room."),
        w("Yielding", "adjective", "Soft, flexible, and open to change.", "A yielding mind learns more easily."),
    ],
    "Z": [
        w("Zenith", "noun", "The time at which something is most powerful or successful.", "Reaching the mountain peak was the zenith of the trip."),
        w("Zeal", "noun", "Great energy or enthusiasm for a cause or goal.", "She wrote with fresh zeal each morning."),
    ],
}


def generate_ai_word(letter: str) -> dict:
    """Ask Gemini for a word. Raises if the call fails or the result is invalid."""
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY is not set")

    from google import genai  # imported here so a missing package falls back too
    from google.genai import types

    client = genai.Client(api_key=settings.gemini_api_key)
    prompt = (
        f"Give me one uncommon but useful English word that begins with the letter {letter}. "
        f"The first letter of the word MUST be {letter}. "
        "It should suit a calm, reflective journaling app. "
        'Return a JSON object with exactly these keys: "word", "part_of_speech", '
        '"definition", "example".'
    )
    response = client.models.generate_content(
        model=settings.gemini_model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=1.0,
            http_options=types.HttpOptions(timeout=8000),  # milliseconds
        ),
    )
    data = json.loads(response.text)

    word = str(data.get("word", "")).strip()
    if not word.isalpha() or word[0].upper() != letter:
        raise ValueError(f"AI returned a word that doesn't start with {letter}: {word!r}")

    result = {
        "word": word.capitalize(),
        "part_of_speech": str(data.get("part_of_speech", "")).strip(),
        "definition": str(data.get("definition", "")).strip(),
        "example": str(data.get("example", "")).strip(),
    }
    if not result["definition"] or not result["example"]:
        raise ValueError("AI response was missing a definition or example")
    return result


@router.get("/vocabulary")
def get_vocabulary(
    letter: Optional[str] = Query(None, description="Single letter from A to Z"),
    authorization: Optional[str] = Header(None),
    user=Depends(get_optional_current_user),
):
    cleaned_letter = "S"
    if letter:
        cleaned_letter = letter.strip().upper()
        if len(cleaned_letter) != 1 or cleaned_letter not in VOCABULARY_DATA:
            raise HTTPException(
                status_code=422,
                detail="letter must be a single letter from A to Z",
            )

    # 1) Try Gemini (validated, with one retry)
    for attempt in range(AI_ATTEMPTS):
        try:
            result = generate_ai_word(cleaned_letter)
            return {**result, "letter": cleaned_letter, "source": "ai"}
        except Exception as err:
            logger.warning("Vocab AI attempt %d failed for %s: %s", attempt + 1, cleaned_letter, err)

    # 2) AI had problems, so use the built-in list
    fallback = random.choice(VOCABULARY_DATA[cleaned_letter])
    return {**fallback, "letter": cleaned_letter, "source": "fallback"}