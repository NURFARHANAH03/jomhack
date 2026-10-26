"""Database layer for vocabulary history: which words each author has already seen.

Like PostRepository, it ONLY runs queries. The rules (no repeats, right letter)
live in VocabularyService.
"""
from supabase import Client


class VocabularyRepository:
    TABLE = "vocabulary_seen"

    def __init__(self, client: Client):
        self.client = client

    def _table(self):
        return self.client.table(self.TABLE)

    def list_words(self, author_id: str, letter: str) -> list[str]:
        """Words this author has already been shown for this letter."""
        rows = (
            self._table()
            .select("word")
            .eq("author_id", author_id)
            .eq("letter", letter.upper())
            .execute()
            .data
        )
        words = [row["word"] for row in rows]
        return words

    def add(self, author_id: str, word: str, letter: str) -> None:
        """Remember a word. If it's already saved, do nothing."""
        self._table().upsert(
            {"author_id": author_id, "word": word.lower(), "letter": letter.upper()},
            on_conflict="author_id,word",
            ignore_duplicates=True,
        ).execute()

    def clear(self, author_id: str) -> None:
        """Forget everything this author has seen (handy for tests / a reset button)."""
        self._table().delete().eq("author_id", author_id).execute()

