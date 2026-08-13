# ============================================================
#  routes/users.py
#  ---------------
#  Endpoints for user search and contact management.
#
#  ENDPOINTS
#  ---------
#  GET /users/search - Search users by phone number or display name
#
#  USAGE
#  -----
#  Used when starting a new conversation or adding members to a group.
#  The search is case-insensitive and partial-match.
# ============================================================

from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.auth import get_current_user
from app.schemas import UserSearchResponse

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/search", response_model=List[UserSearchResponse])
def search_users(
    q: str = Query(..., min_length=1, description="Search query (phone or name)"),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Search for users by phone number or display name.
    
    Excludes the current user from results.
    Used for:
    - Starting new direct conversations
    - Adding members to groups
    """
    users = (
        db.query(User)
        .filter(
            User.id != current_user.id,
            or_(
                User.phone_number.ilike(f"%{q}%"),
                User.display_name.ilike(f"%{q}%"),
            ),
        )
        .limit(limit)
        .all()
    )
    
    return [
        UserSearchResponse(
            id=user.id,
            phone_number=user.phone_number,
            display_name=user.display_name,
            avatar_url=user.avatar_url,
            is_online=user.is_online,
        )
        for user in users
    ]


@router.get("/{user_id}", response_model=UserSearchResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific user's public profile."""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserSearchResponse(
        id=user.id,
        phone_number=user.phone_number,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        is_online=user.is_online,
    )
