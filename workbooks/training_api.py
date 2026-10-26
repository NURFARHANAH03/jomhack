from typing import Annotated
from fastapi import FastAPI, Form, File, UploadFile, Header, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Local classroom fake API")

# Allow frontend requests from local dev servers (Live Server / Vite / React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
    ],
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# Initial in-memory database storage
posts = {
    1: {
        "id": 1,
        "title": "Training story",
        "body": "A local test record",
        "author_id": "ada",
    }
}
next_id = 2


# 1. READ ALL POSTS
@app.get("/posts")
def list_posts():
    return list(posts.values())


# 2. READ A SINGLE POST BY ID
@app.get("/posts/{post_id}")
def detail(post_id: int):
    if post_id not in posts:
        raise HTTPException(404, "Post not found")
    return posts[post_id]


# 3. CREATE A NEW POST (UNPROTECTED)
@app.post("/posts", status_code=201)
async def create(
    title: Annotated[str, Form()],
    body: Annotated[str, Form()],
    image: UploadFile | None = File(default=None),
    authorization: str | None = Header(default=None),
):
    global next_id

    # Validation: Ensure title and body are not empty spaces
    if not title.strip() or not body.strip():
        raise HTTPException(422, "Title and body required")

    # Read image bytes if uploaded (simulates handling multipart form files)
    if image:
        await image.read(5_000_001)

    post = {
        "id": next_id,
        "title": title.strip(),
        "body": body.strip(),
        "author_id": "ada",
    }
    posts[next_id] = post
    next_id += 1
    return post


# 4. CREATE A POST (PROTECTED BY TOKEN)
@app.post("/protected-posts", status_code=201)
async def protected_create(
    title: Annotated[str, Form()],
    body: Annotated[str, Form()],
    image: UploadFile | None = File(default=None),
    authorization: str | None = Header(default=None),
):
    # Verify fake authorization token
    if authorization != "Bearer classroom-fake-token":
        raise HTTPException(401, "Fake sign in required")

    return await create(title, body, image, authorization)


# 5. DELETE A POST BY ID
@app.delete("/posts/{post_id}", status_code=204)
def delete(post_id: int):
    if posts.pop(post_id, None) is None:
        raise HTTPException(404, "Post not found")
    return Response(status_code=204)