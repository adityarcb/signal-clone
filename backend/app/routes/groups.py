# ============================================================
#  routes/groups.py
#  ----------------
#  Endpoint for creating group conversations.
#
#  ENDPOINTS
#  ---------
#  POST /groups - Create a new group conversation
#
#  DATA FLOW
#  ---------
#  1. User sends group name + participant IDs
#  2. Validate that all participant IDs exist
#  3. Create Conversation (is_group=True)
#  4. Add ConversationParticipant rows (creator is admin)
#  5. Return the new group with participant details
# ============================================================

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Conversation, ConversationParticipant
from app.auth import get_current_user
from app.schemas import CreateGroupRequest, GroupResponse, ConversationParticipantResponse

router = APIRouter(prefix="/groups", tags=["Groups"])


@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(
    request: CreateGroupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new group conversation.
    
    The creator is automatically added as an admin.
    All specified participants are added to the group.
    """
    unique_participant_ids = set(request.participant_ids)
    
    if current_user.id not in unique_participant_ids:
        unique_participant_ids.add(current_user.id)
    
    users = db.query(User).filter(User.id.in_(unique_participant_ids)).all()
    
    if len(users) != len(unique_participant_ids):
        found_ids = {u.id for u in users}
        missing_ids = unique_participant_ids - found_ids
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Users not found: {list(missing_ids)}",
        )
    
    conversation = Conversation(
        is_group=True,
        name=request.name,
    )
    db.add(conversation)
    db.flush()
    
    for user in users:
        participant = ConversationParticipant(
            conversation_id=conversation.id,
            user_id=user.id,
            is_admin=(user.id == current_user.id),
        )
        db.add(participant)
    
    db.commit()
    db.refresh(conversation)
    
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
    
    return GroupResponse(
        id=conversation.id,
        name=conversation.name,
        is_group=True,
        participants=participants_data,
        created_at=conversation.created_at,
    )
