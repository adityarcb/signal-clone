# ============================================================
#  routes/conversations.py
#  -----------------------
#  Endpoints for fetching conversations and messages.
#
#  ENDPOINTS
#  ---------
#  GET /conversations - List all conversations for the logged-in user
#  GET /conversations/{id}/messages - Get messages for a specific chat
#
#  DATA FLOW
#  ---------
#  1. Frontend calls GET /conversations with Bearer token
#  2. We decode the token to get user_id
#  3. Query ConversationParticipant to find user's conversations
#  4. For each conversation, fetch the last message and unread count
#  5. Return sorted by most recent activity
# ============================================================

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import User, Conversation, ConversationParticipant, Message
from app.auth import get_current_user
from app.schemas import (
    ConversationResponse,
    ConversationDetailResponse,
    MessageResponse,
    ConversationParticipantResponse,
)

router = APIRouter(prefix="/conversations", tags=["Conversations"])


def build_conversation_response(
    conversation: Conversation,
    current_user_id: int,
    include_messages: bool = False,
) -> dict:
    """
    Helper function to build a conversation response dict.
    
    This extracts the common logic of:
    - Getting the display name (group name or other participant's name)
    - Fetching the last message
    - Building participant list
    """
    participants_data = []
    for p in conversation.participants:
        participants_data.append(
            ConversationParticipantResponse(
                user_id=p.user.id,
                display_name=p.user.display_name,
                avatar_url=p.user.avatar_url,
                is_admin=p.is_admin,
            )
        )
    
    last_message = None
    if conversation.messages:
        sorted_messages = sorted(conversation.messages, key=lambda m: m.timestamp, reverse=True)
        if sorted_messages:
            msg = sorted_messages[0]
            last_message = MessageResponse(
                id=msg.id,
                conversation_id=msg.conversation_id,
                sender_id=msg.sender_id,
                sender_name=msg.sender.display_name,
                content=msg.content,
                timestamp=msg.timestamp,
                status=msg.status,
            )
    
    unread_count = 0
    
    return ConversationResponse(
        id=conversation.id,
        is_group=conversation.is_group,
        name=conversation.name,
        created_at=conversation.created_at,
        participants=participants_data,
        last_message=last_message,
        unread_count=unread_count,
    )


@router.get("", response_model=List[ConversationResponse])
def get_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch all conversations for the logged-in user.
    
    Returns conversations sorted by most recent message, with:
    - Participant info
    - Last message preview
    - Unread count (placeholder for now)
    """
    user_conversations = (
        db.query(Conversation)
        .join(ConversationParticipant)
        .filter(ConversationParticipant.user_id == current_user.id)
        .options(
            joinedload(Conversation.participants).joinedload(ConversationParticipant.user),
            joinedload(Conversation.messages).joinedload(Message.sender),
        )
        .all()
    )
    
    responses = []
    for conv in user_conversations:
        responses.append(build_conversation_response(conv, current_user.id))
    
    responses.sort(
        key=lambda c: c.last_message.timestamp if c.last_message else c.created_at,
        reverse=True,
    )
    
    return responses


@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
def get_messages(
    conversation_id: int,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch messages for a specific conversation.
    
    Pagination: Use limit/offset to load older messages.
    Returns messages sorted by timestamp (oldest first).
    """
    participant = (
        db.query(ConversationParticipant)
        .filter(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == current_user.id,
        )
        .first()
    )
    
    if not participant:
        raise HTTPException(
            status_code=403,
            detail="You are not a participant in this conversation.",
        )
    
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .options(joinedload(Message.sender))
        .order_by(Message.timestamp.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    
    messages.reverse()
    
    return [
        MessageResponse(
            id=msg.id,
            conversation_id=msg.conversation_id,
            sender_id=msg.sender_id,
            sender_name=msg.sender.display_name,
            content=msg.content,
            timestamp=msg.timestamp,
            status=msg.status,
        )
        for msg in messages
    ]


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetch a single conversation with all its messages.
    
    Useful when opening a chat from the conversation list.
    """
    participant = (
        db.query(ConversationParticipant)
        .filter(
            ConversationParticipant.conversation_id == conversation_id,
            ConversationParticipant.user_id == current_user.id,
        )
        .first()
    )
    
    if not participant:
        raise HTTPException(
            status_code=403,
            detail="You are not a participant in this conversation.",
        )
    
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id)
        .options(
            joinedload(Conversation.participants).joinedload(ConversationParticipant.user),
            joinedload(Conversation.messages).joinedload(Message.sender),
        )
        .first()
    )
    
    messages_data = [
        MessageResponse(
            id=msg.id,
            conversation_id=msg.conversation_id,
            sender_id=msg.sender_id,
            sender_name=msg.sender.display_name,
            content=msg.content,
            timestamp=msg.timestamp,
            status=msg.status,
        )
        for msg in sorted(conversation.messages, key=lambda m: m.timestamp)
    ]
    
    participants_data = [
        ConversationParticipantResponse(
            user_id=p.user.id,
            display_name=p.user.display_name,
            avatar_url=p.user.avatar_url,
            is_admin=p.is_admin,
        )
        for p in conversation.participants
    ]
    
    return ConversationDetailResponse(
        id=conversation.id,
        is_group=conversation.is_group,
        name=conversation.name,
        created_at=conversation.created_at,
        participants=participants_data,
        messages=messages_data,
        last_message=messages_data[-1] if messages_data else None,
        unread_count=0,
    )
