# ============================================================
#  schemas.py
#  ----------
#  Pydantic models for request validation and response serialization.
#
#  WHY PYDANTIC?
#  -------------
#  - FastAPI uses Pydantic for automatic request validation.
#  - It generates OpenAPI docs (Swagger UI) from these schemas.
#  - It ensures we never accidentally return internal DB fields.
#  - It separates "what the API accepts" from "how we store it".
#
#  NAMING CONVENTION
#  -----------------
#  - *Create: Input schemas for POST requests
#  - *Response: Output schemas for API responses
#  - *Base: Shared fields between Create and Response
# ============================================================

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models import MessageStatus


# ------------------------------------------------------------------
# USER SCHEMAS
# ------------------------------------------------------------------
class UserBase(BaseModel):
    """Shared fields for user input/output."""
    phone_number: str
    display_name: str


class UserCreate(UserBase):
    """Schema for creating a new user (registration)."""
    pass


class UserResponse(BaseModel):
    """Schema returned by API endpoints that expose user info."""
    id: int
    phone_number: str
    display_name: str
    avatar_url: Optional[str] = None
    is_online: bool = False
    last_seen: Optional[datetime] = None

    class Config:
        from_attributes = True


# ------------------------------------------------------------------
# AUTH SCHEMAS
# ------------------------------------------------------------------
class RegisterRequest(BaseModel):
    """Request body for POST /auth/register."""
    phone_number: str = Field(..., description="User's phone number")


class OTPVerifyRequest(BaseModel):
    """Request body for POST /auth/verify-otp."""
    phone_number: str
    code: str


class ProfileUpdateRequest(BaseModel):
    """Request body for PUT /auth/profile."""
    display_name: str = Field(..., min_length=1, max_length=100)
    avatar_url: Optional[str] = None


class LoginRequest(BaseModel):
    """Request body for POST /auth/login."""
    phone_number: str = Field(..., description="User's phone number")


class LoginResponse(BaseModel):
    """Response for successful login."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ------------------------------------------------------------------
# CONVERSATION SCHEMAS
# ------------------------------------------------------------------
class ConversationParticipantResponse(BaseModel):
    """Nested schema showing a participant in a conversation."""
    user_id: int
    display_name: str
    avatar_url: Optional[str] = None
    is_admin: bool = False
    is_online: bool = False
    last_seen: Optional[datetime] = None

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    """Schema for a single message in API responses."""
    id: int
    conversation_id: int
    sender_id: int
    sender_name: Optional[str] = None
    content: str
    timestamp: datetime
    status: MessageStatus

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    """Schema for a conversation list item."""
    id: int
    is_group: bool
    name: Optional[str] = None
    created_at: datetime
    participants: List[ConversationParticipantResponse] = []
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0

    class Config:
        from_attributes = True


class ConversationDetailResponse(ConversationResponse):
    """Extended schema when fetching a single conversation."""
    messages: List[MessageResponse] = []


class CreateDirectRequest(BaseModel):
    """Request body for POST /conversations/direct."""
    target_user_id: int


# ------------------------------------------------------------------
# GROUP SCHEMAS
# ------------------------------------------------------------------
class CreateGroupRequest(BaseModel):
    """Request body for POST /groups."""
    name: str = Field(..., min_length=1, max_length=100)
    participant_ids: List[int] = Field(..., min_items=2)


class AddMemberRequest(BaseModel):
    """Request body for POST /groups/{id}/members."""
    user_id: int


class GroupResponse(BaseModel):
    """Response after creating a group."""
    id: int
    name: str
    is_group: bool = True
    participants: List[ConversationParticipantResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


# ------------------------------------------------------------------
# USER SEARCH SCHEMAS
# ------------------------------------------------------------------
class UserSearchResponse(BaseModel):
    """Schema for user search results."""
    id: int
    phone_number: str
    display_name: str
    avatar_url: Optional[str] = None
    is_online: bool = False

    class Config:
        from_attributes = True


# ------------------------------------------------------------------
# MESSAGE SCHEMAS
# ------------------------------------------------------------------
class SendMessageRequest(BaseModel):
    """Request body for sending a message (used in WebSocket too)."""
    conversation_id: int
    content: str = Field(..., min_length=1, max_length=10000)


class MessageStatusUpdate(BaseModel):
    """Schema for updating message status via WebSocket."""
    message_id: int
    status: MessageStatus
