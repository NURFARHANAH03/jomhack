"""PostService: the business rules for journal posts.

Uses PostRepository (database) and MediaService (files). The router calls
this class; this class never touches HTTP forms or SQL directly.
"""
from typing import Optional

from fastapi import HTTPException, UploadFile

from kokoronal.database import PostRepository
from kokoronal.schemas import MOODS
from kokoronal.services.media_service import MediaService


class PostService:
    MAX_TITLE = 160
    MAX_BODY = 20000

    def __init__(self, posts: PostRepository, media: MediaService, default_author_id: str):
        self.posts = posts
        self.media = media
        self.default_author_id = default_author_id

    # ---------- validation helpers ----------
    @staticmethod
    def _clean_text(value: str, field: str, max_len: int) -> str:
        value = value.strip()
        if not value or len(value) > max_len:
            raise HTTPException(422, f"{field} must be between 1 and {max_len} characters")
        return value

    @staticmethod
    def _clean_mood(mood: Optional[str]) -> Optional[str]:
        """None / blank -> no mood. Otherwise must be a valid mood."""
        if mood is None:
            return None
        mood = mood.strip()
        if mood == "":
            return None
        if mood not in MOODS:
            raise HTTPException(422, f"mood must be one of: {', '.join(sorted(MOODS))}")
        return mood

    # ---------- READ ----------
    def list_posts(self, author_id: Optional[str] = None) -> list[dict]:
        return self.posts.list_posts(author_id)

    def get_post(self, post_id: int, user_id: Optional[str] = None) -> dict:
        post = self.posts.get_by_id(post_id)
        if post is None:
            raise HTTPException(404, "Post not found")
        if user_id is not None and post["author_id"] != user_id:
            raise HTTPException(403, "This story belongs to someone else")
        return post

    # ---------- CREATE ----------
    def create_post(
        self,
        title: str,
        body: str,
        mood: Optional[str],
        author_id: Optional[str],
        image: Optional[UploadFile],
    ) -> dict:
        row = {
            "title": self._clean_text(title, "title", self.MAX_TITLE),
            "body": self._clean_text(body, "body", self.MAX_BODY),
            "mood": self._clean_mood(mood),
            "author_id": (author_id or "").strip() or self.default_author_id,
            "image": None,
        }

        # Browsers send an empty file part when no file is chosen -> check filename
        if image is not None and image.filename:
            row["image"] = self.media.upload(image)

        try:
            return self.posts.create(row)
        except Exception:
            self.media.delete(row["image"])  # don't leave an orphaned upload
            raise

    # ---------- UPDATE ----------
    def update_post(
        self,
        post_id: int,
        title: Optional[str],
        body: Optional[str],
        mood: Optional[str],
        clear_mood: bool,
        remove_image: bool,
        image: Optional[UploadFile],
        user_id: Optional[str] = None,
    ) -> dict:
        existing = self.get_post(post_id, user_id)  # 404 if missing
        changes: dict = {}

        if title is not None:
            changes["title"] = self._clean_text(title, "title", self.MAX_TITLE)
        if body is not None:
            changes["body"] = self._clean_text(body, "body", self.MAX_BODY)
        if clear_mood:
            changes["mood"] = None
        elif mood is not None:
            changes["mood"] = self._clean_mood(mood)

        new_url: Optional[str] = None
        if image is not None and image.filename:
            new_url = self.media.upload(image)
            changes["image"] = new_url
        elif remove_image:
            changes["image"] = None

        if not changes:
            raise HTTPException(400, "No fields to update")

        try:
            updated = self.posts.update(post_id, changes)
        except Exception:
            self.media.delete(new_url)
            raise

        if updated is None:
            self.media.delete(new_url)
            raise HTTPException(404, "Post not found")

        # The old file is no longer referenced -> clean it up
        if "image" in changes:
            self.media.delete(existing.get("image"))

        return updated

    # ---------- DELETE ----------
    def delete_post(self, post_id: int, user_id: Optional[str] = None) -> None:
        existing = self.get_post(post_id, user_id)  # 404 if missing, 403 if not yours
        self.posts.delete(post_id)
        self.media.delete(existing.get("image"))
