"""Database layer: the ONLY place that runs queries on the `posts` table.

It knows nothing about HTTP, validation or file uploads - it just reads and
writes rows. That makes it easy to test (or swap) on its own.
"""
from typing import Optional

from supabase import Client


class PostRepository:
    TABLE = "posts"

    def __init__(self, client: Client):
        self.client = client

    def _table(self):
        return self.client.table(self.TABLE)

    def list_posts(self, author_id: Optional[str] = None) -> list[dict]:
        query = self._table().select("*").order("created_at", desc=True)
        if author_id:
            query = query.eq("author_id", author_id)
        return query.execute().data

    def get_by_id(self, post_id: int) -> Optional[dict]:
        res = self._table().select("*").eq("id", post_id).limit(1).execute()
        return res.data[0] if res.data else None

    def create(self, row: dict) -> dict:
        return self._table().insert(row).execute().data[0]

    def update(self, post_id: int, changes: dict) -> Optional[dict]:
        res = self._table().update(changes).eq("id", post_id).execute()
        return res.data[0] if res.data else None

    def delete(self, post_id: int) -> None:
        self._table().delete().eq("id", post_id).execute()
