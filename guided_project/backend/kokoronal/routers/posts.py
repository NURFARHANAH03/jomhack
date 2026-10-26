"""HTTP layer for /posts. Reads the request, calls PostService, returns the result. It’s the router that turns your post logic into web addresses: this is where your 5 CRUD operations become real endpoints."""
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, Response, UploadFile

from kokoronal.dependencies import get_current_user, get_post_service
from kokoronal.schemas import CurrentUser, Post
from kokoronal.services.post_service import PostService

router = APIRouter(prefix="/posts", tags=["posts"])


# READ (list) - 200
@router.get("", response_model=list[Post])
def list_posts(
    user: CurrentUser = Depends(get_current_user),
    service: PostService = Depends(get_post_service),
):
    print("DEBUG [router] GET /posts | user:", user.id)
    return service.list_posts(user.id)

# READ (detail) - 200
@router.get("/{post_id}", response_model=Post)
def get_post(post_id: int, service: PostService = Depends(get_post_service)):  
    return service.get_post(post_id)


# CREATE - 201  (multipart FormData: title, body, mood, image)
@router.post("", response_model=Post, status_code=201)
def create_post(
    title: str = Form(...),
    body: str = Form(...),
    mood: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    user: CurrentUser = Depends(get_current_user),      # 1. Require logged-in user
    service: PostService = Depends(get_post_service),
): 
    # 2. Pass user.id as author_id to your service
    return service.create_post(title, body, mood, user.id, image)

# UPDATE - 200  (only the fields you send are changed)
@router.put("/{post_id}", response_model=Post)
def update_post(
    post_id: int,
    title: Optional[str] = Form(None),
    body: Optional[str] = Form(None),
    mood: Optional[str] = Form(None),
    clear_mood: bool = Form(False),            # true = remove the mood
    remove_image: bool = Form(False),
    image: Optional[UploadFile] = File(None),  # a new file replaces the old one
    service: PostService = Depends(get_post_service),
):
    return service.update_post(post_id, title, body, mood, clear_mood, remove_image, image)


# DELETE - 204
@router.delete("/{post_id}", status_code=204)
def delete_post(post_id: int, service: PostService = Depends(get_post_service)):
    service.delete_post(post_id)
    return Response(status_code=204)
