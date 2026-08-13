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
from app.schemas import CreateGroupRequest, GroupResponse, ConversationParticipantResponse, AddMemberRequest

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
                is_online=p.user.is_online,
                last_seen=p.user.last_seen,
            )
        )
    
    return GroupResponse(
        id=conversation.id,
        name=conversation.name,
        is_group=True,
        participants=participants_data,
        created_at=conversation.created_at,
    )


@router.get("/{conversation_id}/members", response_model=list[ConversationParticipantResponse])
def get_group_members(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get members of a group conversation."""
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.is_group == True).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Group not found")
        
    # Ensure current user is in the group
    is_member = any(p.user_id == current_user.id for p in conversation.participants)
    if not is_member:
        raise HTTPException(status_code=403, detail="You are not a member of this group")
        
    participants_data = []
    for p in conversation.participants:
        participants_data.append(
            ConversationParticipantResponse(
                user_id=p.user.id,
                display_name=p.user.display_name,
                avatar_url=p.user.avatar_url,
                is_admin=p.is_admin,
                is_online=p.user.is_online,
                last_seen=p.user.last_seen,
            )
        )
    return participants_data


@router.post("/{conversation_id}/members", response_model=ConversationParticipantResponse)
def add_group_member(
    conversation_id: int,
    request: AddMemberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a member to the group (Admin only)."""
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.is_group == True).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Group not found")
        
    current_participant = next((p for p in conversation.participants if p.user_id == current_user.id), None)
    if not current_participant or not current_participant.is_admin:
        raise HTTPException(status_code=403, detail="You must be an admin to add members")
        
    if any(p.user_id == request.user_id for p in conversation.participants):
        raise HTTPException(status_code=400, detail="User is already a member")
        
    target_user = db.query(User).filter(User.id == request.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User to add not found")
        
    new_participant = ConversationParticipant(
        conversation_id=conversation.id,
        user_id=target_user.id,
        is_admin=False
    )
    db.add(new_participant)
    db.commit()
    db.refresh(new_participant)
    
    return ConversationParticipantResponse(
        user_id=new_participant.user.id,
        display_name=new_participant.user.display_name,
        avatar_url=new_participant.user.avatar_url,
        is_admin=new_participant.is_admin,
        is_online=new_participant.user.is_online,
        last_seen=new_participant.user.last_seen,
    )


@router.delete("/{conversation_id}/members/{user_id}")
def remove_group_member(
    conversation_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a member from the group (Admin only)."""
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id, Conversation.is_group == True).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Group not found")
        
    current_participant = next((p for p in conversation.participants if p.user_id == current_user.id), None)
    if not current_participant or not current_participant.is_admin:
        raise HTTPException(status_code=403, detail="You must be an admin to remove members")
        
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot remove yourself. Use /leave instead.")
        
    target_participant = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == user_id
    ).first()
    
    if not target_participant:
        raise HTTPException(status_code=404, detail="User is not a member of this group")
        
    db.delete(target_participant)
    db.commit()
    return {"message": "Member removed successfully"}


@router.post("/{conversation_id}/leave")
def leave_group(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Leave a group conversation."""
    participant = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == conversation_id,
        ConversationParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="You are not a member of this group")
        
    # Check if this was the group (sanity check)
    conversation = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conversation or not conversation.is_group:
        raise HTTPException(status_code=400, detail="Cannot leave a non-group conversation")
        
    db.delete(participant)
    db.commit()
    
    # Optional: If no members left, delete the group? We'll leave it as a ghost group for simplicity.
    return {"message": "Left group successfully"}
