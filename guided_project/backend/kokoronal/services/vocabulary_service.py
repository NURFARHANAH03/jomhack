"""VocabularyService: the reward word, starting with the letter the user picked.

How it works:
  1. Look up which words this author has already seen for that letter.
  2. Ask Gemini for a NEW word starting with the letter (word + definition +
     example in one call). Check the answer ourselves: right letter? one word?
     not seen before? If not, ask again (max 3 tries).
  3. If Gemini is unavailable or keeps failing, use a built-in word list for
     that letter (also avoiding repeats when possible).
  4. Remember the word so it never comes back.

NOTE: no journal text is ever sent to Gemini (entries are private).
"""
import logging
import random
import re
import string
from typing import Optional

from fastapi import HTTPException
from google import genai
from google.genai import types

from kokoronal.schemas import VocabAI, Vocabulary
from kokoronal.vocabulary_repository import VocabularyRepository

logger = logging.getLogger(__name__)

# (word, part of speech, definition, example) - two per letter, used when Gemini can't help
_FALLBACK = [
    ("ambitious", "adjective", "Having a strong wish to succeed or achieve something.", "She is ambitious and plans to finish her degree early."),
    ("abundant", "adjective", "Existing in large amounts; more than enough.", "The market had abundant fresh fruit this season."),
    ("brisk", "adjective", "Quick and full of energy.", "We took a brisk walk before breakfast."),
    ("benevolent", "adjective", "Kind and wanting to help other people.", "The benevolent teacher stayed late to help her students."),
    ("curious", "adjective", "Eager to learn or know more about something.", "He was curious about how the old clock worked."),
    ("candid", "adjective", "Honest and direct, even when the truth is hard.", "She gave a candid answer about her mistakes."),
    ("diligent", "adjective", "Showing careful and steady effort in work.", "His diligent practice paid off at the recital."),
    ("delight", "noun", "A feeling of great pleasure and happiness.", "The children squealed with delight at the surprise."),
    ("eloquent", "adjective", "Able to speak or write clearly and beautifully.", "The speaker gave an eloquent talk about kindness."),
    ("embrace", "verb", "To accept something willingly and with enthusiasm.", "She decided to embrace the new challenge."),
    ("flourish", "verb", "To grow well or develop successfully.", "Her small garden began to flourish after the rain."),
    ("fortitude", "noun", "Strength of mind to face pain or difficulty.", "He showed great fortitude during his recovery."),
    ("gratitude", "noun", "The feeling of being thankful and appreciative.", "She wrote a note expressing her gratitude to the team."),
    ("genuine", "adjective", "Real and sincere, not pretended.", "I received a genuine compliment today."),
    ("harmony", "noun", "A peaceful state where people or things work well together.", "The choir sang in perfect harmony."),
    ("humble", "adjective", "Not proud; not thinking you are better than others.", "Despite her success, she stayed humble."),
    ("inspire", "verb", "To make someone feel excited and eager to do something.", "Her story can inspire other students to keep trying."),
    ("intricate", "adjective", "Having many small, detailed parts.", "The intricate pattern took hours to draw."),
    ("jubilant", "adjective", "Feeling or showing great joy, especially after success.", "The team was jubilant after winning the final."),
    ("justify", "verb", "To show or explain why something is right or reasonable.", "He tried to justify his decision with clear reasons."),
    ("keen", "adjective", "Very interested or eager.", "She is keen to learn how to code."),
    ("kindle", "verb", "To start a fire, or to awaken a feeling or interest.", "The book helped kindle his love of science."),
    ("lucid", "adjective", "Clear and easy to understand.", "Her lucid explanation made the topic simple."),
    ("linger", "verb", "To stay somewhere longer than expected.", "We lingered at the cafe after the rain stopped."),
    ("mindful", "adjective", "Paying careful attention to something.", "Be mindful of the time while you study."),
    ("meticulous", "adjective", "Very careful about small details.", "He kept meticulous notes for every lecture."),
    ("nostalgia", "noun", "A warm, wistful feeling about the past.", "The old photos filled her with nostalgia."),
    ("nurture", "verb", "To care for and help something grow.", "She likes to nurture her plants every morning."),
    ("optimistic", "adjective", "Hopeful about the future.", "He felt optimistic about the exam results."),
    ("observe", "verb", "To watch something carefully.", "We observed the birds from the window."),
    ("ponder", "verb", "To think about something slowly and thoughtfully.", "She sat by the window to ponder her next step."),
    ("perseverance", "noun", "Continuing to try despite difficulty.", "Perseverance helped him finish the marathon."),
    ("quaint", "adjective", "Attractively old-fashioned or unusual.", "We stayed in a quaint cottage by the sea."),
    ("quench", "verb", "To satisfy thirst, or to put out a fire.", "A cold drink quenched her thirst after the run."),
    ("resilient", "adjective", "Able to recover quickly after difficulties.", "She stayed resilient even after the project failed twice."),
    ("reflect", "verb", "To think carefully and deeply about something.", "I like to reflect on my day before going to sleep."),
    ("serene", "adjective", "Calm, peaceful, and untroubled.", "The lake looked serene in the early morning light."),
    ("sincere", "adjective", "Honest and meaning what you say.", "He offered a sincere apology."),
    ("tenacity", "noun", "The quality of not giving up, even when things are hard.", "Her tenacity helped her finally fix the stubborn bug."),
    ("tranquil", "adjective", "Quiet, calm and free from disturbance.", "The library was tranquil in the afternoon."),
    ("unwind", "verb", "To relax after a period of work or stress.", "I like to unwind with a book after class."),
    ("uplifting", "adjective", "Making you feel more cheerful and hopeful.", "The uplifting song brightened her morning."),
    ("vivid", "adjective", "Very clear, bright, or detailed.", "She has vivid memories of that summer."),
    ("venture", "noun", "A new activity or project that involves some risk.", "Opening a small bakery was her first business venture."),
    ("whimsical", "adjective", "Playful and unusual in a charming way.", "He drew a whimsical cartoon of a dancing cat."),
    ("wholesome", "adjective", "Good for your health or well-being.", "They shared a wholesome meal of rice and vegetables."),
    ("xenial", "adjective", "Friendly and welcoming to guests.", "The xenial host made every visitor feel at home."),
    ("xylophone", "noun", "A musical instrument with wooden bars that you hit with small hammers.", "She played a cheerful tune on the xylophone."),
    ("yearn", "verb", "To want something very much, especially something you cannot have now.", "He yearned for the holidays to begin."),
    ("yield", "verb", "To produce a result, or to give way.", "Careful practice will yield good results."),
    ("zeal", "noun", "Great energy and enthusiasm for a cause or goal.", "She started the project with great zeal."),
    ("zenith", "noun", "The highest point or peak of something.", "The singer's career reached its zenith that year."),
]

# {"A": [{...}, {...}], "B": [...]}
FALLBACK_BY_LETTER: dict[str, list[dict]] = {}
for _word, _pos, _definition, _example in _FALLBACK:
    FALLBACK_BY_LETTER.setdefault(_word[0].upper(), []).append(
        {"word": _word, "part_of_speech": _pos, "definition": _definition, "example": _example}
    )


class VocabularyService:
    MAX_TRIES = 3
    WORD_PATTERN = re.compile(r"[A-Za-z][A-Za-z'-]*")  # one real word, no spaces or digits

    def __init__(
        self,
        client: Optional[genai.Client],
        model: str,
        history: VocabularyRepository,
        default_author_id: str,
    ):
        self.client = client
        self.model = model
        self.history = history
        self.default_author_id = default_author_id

    # ---------- public ----------
    def get_word(self, letter: Optional[str] = None, author_id: Optional[str] = None) -> Vocabulary:
        letter = self._clean_letter(letter)
        author = (author_id or "").strip() or self.default_author_id
        seen = {w.lower() for w in self.history.list_words(author, letter)}
        avoid = set(seen)  # grows with words Gemini gives us that we reject

        for attempt in range(1, self.MAX_TRIES + 1):
            candidate = self._ask_gemini(letter, avoid)
            if candidate is None:
                break  # Gemini unavailable -> go straight to the fallback list

            word = candidate.word.strip()
            if self._is_acceptable(word, letter, seen):
                self.history.add(author, word, letter)
                return Vocabulary(**{**candidate.model_dump(), "word": word}, source="ai")

            avoid.add(word.lower())

        return self._fallback(letter, author, seen)

    # ---------- helpers ----------
    @staticmethod
    def _clean_letter(letter: Optional[str]) -> str:
        """No letter -> a random one. Otherwise it must be a single A-Z letter."""
        if letter is None or letter.strip() == "":
            return random.choice(string.ascii_uppercase)
        letter = letter.strip()
        if len(letter) != 1 or not (letter.isascii() and letter.isalpha()):
            raise HTTPException(422, "letter must be a single letter from A to Z")
        return letter.upper()

    def _is_acceptable(self, word: str, letter: str, seen: set[str]) -> bool:
        return (
            bool(self.WORD_PATTERN.fullmatch(word))
            and word[0].upper() == letter
            and word.lower() not in seen
        )

    def _ask_gemini(self, letter: str, avoid: set[str]) -> Optional[VocabAI]:
        if self.client is None:
            return None

        prompt = (
            f"Give me one useful English vocabulary word (intermediate to advanced level) "
            f"that starts with the letter '{letter}'. It must be a single real dictionary "
            f"word (no spaces) and not extremely common. "
        )
        if avoid:
            prompt += f"Do NOT use any of these words: {', '.join(sorted(avoid)[:80])}. "
        prompt += (
            "Provide: the word, its part of speech, a clear one-sentence definition in "
            "simple English, and one natural example sentence using the word."
        )

        try:
            resp = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=VocabAI,
                    temperature=1.0,
                ),
            )
            parsed = resp.parsed
            return parsed if isinstance(parsed, VocabAI) else None
        except Exception as exc:  # rate limit, bad key, bad model name, network...
            logger.warning("Gemini vocabulary request failed: %s", exc)
            return None

    def _fallback(self, letter: str, author: str, seen: set[str]) -> Vocabulary:
        options = FALLBACK_BY_LETTER[letter]
        unseen = [o for o in options if o["word"] not in seen]
        if unseen:
            pick = random.choice(unseen)
            self.history.add(author, pick["word"], letter)
        else:
            pick = random.choice(options)  # every built-in word was used: a repeat is unavoidable
        return Vocabulary(**pick, source="fallback")


