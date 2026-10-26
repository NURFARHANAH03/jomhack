"""FastAPI entry point. Run with: uvicorn main:app --reload --port 8000."""
import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from postgrest.exceptions import APIError

from kokoronal.config import settings
from kokoronal.routers import auth, health, posts, vocabulary

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("kokoronal")

app = FastAPI(title="Kokoronal Journal API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.frontend_origin.split(",")],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(APIError)
async def supabase_error_handler(_: Request, exc: APIError):
    """Any Supabase/Postgres error becomes a clean 502 instead of a crash."""
    logger.error("Supabase error: %s", exc)
    return JSONResponse(status_code=502, content={"detail": f"Database error: {exc.message}"})


app.include_router(health.router)
app.include_router(auth.router)
app.include_router(posts.router)
app.include_router(vocabulary.router)
