from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from kokoronal.dependencies import get_current_user, get_supabase_client
from kokoronal.schemas import CurrentUser

router = APIRouter(tags=["auth"])

class AuthRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., json_schema_extra={"format": "password"})

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/signup")
def signup(credentials: AuthRequest, supabase=Depends(get_supabase_client)):
    try:
        res = supabase.auth.sign_up({
            "email": credentials.email,
            "password": credentials.password
        })
        return res
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/token", response_model=TokenResponse)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    supabase=Depends(get_supabase_client)
):
    try:
        res = supabase.auth.sign_in_with_password({
            "email": form_data.username,
            "password": form_data.password,
        })

        if not res.session or not res.session.access_token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email not confirmed or invalid credentials"
            )

        return TokenResponse(access_token=res.session.access_token)
    except Exception as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(err) if hasattr(err, 'message') else "Invalid email or password",
        ) from err

@router.get("/me", response_model=CurrentUser)
def me(user: CurrentUser = Depends(get_current_user)):
    return user