"""MediaService: validates and stores images/videos in Supabase Storage."""
import logging
from typing import Optional
from uuid import uuid4

from fastapi import HTTPException, UploadFile
from supabase import Client, create_client

from kokoronal.config import settings

logger = logging.getLogger(__name__)


class MediaService:
    # content-type -> file extension (matches the bucket's allowed types)
    ALLOWED_TYPES = {
        "image/png": ".png",
        "image/jpeg": ".jpg",
        "image/webp": ".webp",
        "image/gif": ".gif",
        "video/mp4": ".mp4",
        "video/webm": ".webm",
    }

    def __init__(self, client: Client, bucket: str, max_mb: int):
        self.bucket = bucket
        # Own client: login on the shared client must not change storage permissions
        storage_client = create_client(settings.supabase_url, settings.supabase_service_role_key)
        self.storage = storage_client.storage.from_(bucket)
        self.max_bytes = max_mb * 1024 * 1024
        self.max_mb = max_mb

    def upload(self, file: UploadFile) -> str:
        """Validate + upload. Returns the file's public URL."""
        content_type = (file.content_type or "").lower()
        if content_type not in self.ALLOWED_TYPES:
            raise HTTPException(
                415, "Unsupported file type. Use png, jpg, webp, gif, mp4 or webm."
            )

        data = file.file.read()
        if not data:
            raise HTTPException(400, "Uploaded file is empty")
        if len(data) > self.max_bytes:
            raise HTTPException(413, f"File too large (max {self.max_mb} MB)")

        # Random name: avoids collisions and unsafe user-supplied filenames
        path = f"{uuid4().hex}{self.ALLOWED_TYPES[content_type]}"
        try:
            self.storage.upload(path=path, file=data, file_options={"content-type": content_type})
        except Exception as exc:  # storage errors vary by client version
            logger.error("Upload failed: %s", exc)
            raise HTTPException(502, f"Media upload failed: {exc}")

        url = self.storage.get_public_url(path).split("?")[0]
        return url

    def delete(self, url: Optional[str]) -> None:
        """Best-effort removal of a file, given its public URL."""
        if not url:
            return
        marker = f"/{self.bucket}/"
        if marker not in url:
            return
        path = url.split(marker, 1)[1].split("?")[0]
        try:
            self.storage.remove([path])
        except Exception as exc:
            logger.warning("Could not delete media %s: %s", path, exc)

