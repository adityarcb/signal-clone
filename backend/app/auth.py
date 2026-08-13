# ============================================================
#  auth.py
#  --------
#  Mock authentication endpoints for the Signal clone.
#
#  IMPORTANT: This is NOT real authentication!
#  ---------------------------------------------
#  We mock phone verification and JWT signing. In production you
#  would integrate with Twilio for SMS and use proper JWT libraries.
#
#  HOW IT WORKS
#  ------------
#  1. User POSTs their phone number to /auth/login
#  2. We look up the user in the database (seed data has 4 users)
#  3. If found, we return a mock token + user info
#  4. The frontend stores this token and includes it in headers
#
#  MOCK TOKEN FORMAT
#  -----------------
#  For simplicity, we just base64-encode the user_id. A real app
#  would use jose or pyjwt to sign tokens with a secret key.
# ============================================================

import base64
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import LoginRequest, LoginResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])

security = HTTPBearer(auto_error=False)


def create_mock_token(user_id: int) -> str:
    """
    Create a simple mock JWT-like token.
    
    In production: use jose.jwt.encode() with a secret key.
    Here: just base64 encode "user_id:timestamp" for simplicity.
    """
    payload = f"{user_id}:{datetime.utcnow().timestamp()}"
    return base64.urlsafe_b64encode(payload.encode()).decode()


def decode_mock_token(token: str) -> Optional[int]:
    """
    Decode the mock token and return the user_id.
    
    Returns None if the token is invalid or expired.
    """
    try:
        decoded = base64.urlsafe_b64decode(token.encode()).decode()
        user_id_str, timestamp_str = decoded.split(":")
        user_id = int(user_id_str)
        token_time = datetime.utcfromtimestamp(float(timestamp_str))
        if datetime.utcnow() - token_time > timedelta(days=7):
            return None
        return user_id
    except Exception:
        return None


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency that extracts and validates the current user.
    
    Usage in a route:
        @router.get("/me")
        def get_me(current_user: User = Depends(get_current_user)):
            return {"id": current_user.id, "name": current_user.display_name}
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = credentials.credentials
    user_id = decode_mock_token(token)
    
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Mock login endpoint.
    
    In a real app, this would:
    1. Send SMS verification code via Twilio
    2. User enters code in a separate endpoint
    3. On success, issue JWT
    
    Here we skip all that and just return a token if the phone exists.
    """
    user = db.query(User).filter(User.phone_number == request.phone_number).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Use one of the seeded phone numbers.",
        )
    
    token = create_mock_token(user.id)
    
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return UserResponse.model_validate(current_user)
