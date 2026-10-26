from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from kokoronal.dependencies import get_current_user, get_supabase_client
from kokoronal.schemas import CurrentUser

router = APIRouter(tags=["auth"])

# 1. Define Request & Response Models FIRST
class AuthRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# 2. Route Endpoints BELOW the models
@router.post("/signup", response_model=TokenResponse)
def signup(credentials: AuthRequest, supabase=Depends(get_supabase_client)):
    try:
        res = supabase.auth.sign_up({
            "email": credentials.email,
            "password": credentials.password,
        })
        if not res.session:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Signup successful! Please check your email to confirm your account."
            )
        return TokenResponse(access_token=res.session.access_token)
    except Exception as err:
        raise HTTPException(status_code=400, detail=str(err)) from err

@router.post("/token", response_model=TokenResponse)
def login(credentials: AuthRequest, supabase=Depends(get_supabase_client)):
    try:
        res = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password,
        })
        return TokenResponse(access_token=res.session.access_token)
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        ) from err

@router.get("/me", response_model=CurrentUser)
def me(user: CurrentUser = Depends(get_current_user)):
    return user