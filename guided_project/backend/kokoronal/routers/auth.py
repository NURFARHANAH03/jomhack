from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from kokoronal.dependencies import get_current_user, get_supabase_client
from kokoronal.schemas import CurrentUser

router = APIRouter(tags=["auth"])

# 1. Define Request & Response Models FIRST
from pydantic import BaseModel, EmailStr, Field

# 1. Define AuthRequest with capital EmailStr and masked password field
class AuthRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., json_schema_extra={"format": "password"})

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# 2. Signup Endpoint
@router.post("/signup")
def signup(credentials: AuthRequest, supabase=Depends(get_supabase_client)):
    try:
        res = supabase.auth.sign_up({
            "email": credentials.email,
            "password": credentials.password
        })
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

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