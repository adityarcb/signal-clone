# ============================================================
#  websocket.py
#  ------------
#  WebSocket connection manager and message handling.
#
#  WHAT THIS DOES
#  --------------
#  1. Tracks active WebSocket connections per user
#  2. Handles incoming messages (chat, typing, read receipts)
#  3. Broadcasts messages to conversation participants
#  4. Updates message status (sent -> delivered -> read)
#
#  WEBSOCKET MESSAGE FORMAT (JSON)
#  -------------------------------
#  All messages follow this structure:
#    {
#      "type": "chat" | "typing" | "status_update",
#      "data": { ... }
#    }
#
#  CONNECTION LIFECYCLE
#  --------------------
#  1. Client connects to ws://host/ws?token=XXX
#  2. Server validates token and stores connection
#  3. Client sends/receives messages
#  4. On disconnect, server removes connection
# ============================================================

import json
from datetime import datetime
from typing import Dict, List, Optional, Set

from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import User, Conversation, ConversationParticipant, Message, MessageStatus
from app.auth import decode_mock_token


class ConnectionManager:
    """
    Manages all active WebSocket connections.
    
    DATA STRUCTURES
    ---------------
    - active_connections: Dict[user_id, WebSocket]
        Maps user IDs to their socket connection.
        A user can only have ONE active connection at a time.
    
    - user_conversations: Dict[user_id, Set[conversation_id]]
        Tracks which conversations each user is currently viewing.
        Used for read receipts and typing indicators.
    """
    
    def __init__(self):
        # user_id -> WebSocket
        self.active_connections: Dict[int, WebSocket] = {}
        # user_id -> set of conversation_ids they're viewing
        self.user_conversations: Dict[int, Set[int]] = {}

    async def broadcast_presence(self, user_id: int, is_online: bool, last_seen: datetime):
        db = SessionLocal()
        try:
            # Find all conversations this user is part of
            user_convs = (
                db.query(ConversationParticipant.conversation_id)
                .filter(ConversationParticipant.user_id == user_id)
                .all()
            )
            conv_ids = [c[0] for c in user_convs]
            
            if not conv_ids:
                return
                
            # Find all other participants in these conversations
            other_participants = (
                db.query(ConversationParticipant.user_id)
                .filter(ConversationParticipant.conversation_id.in_(conv_ids))
                .filter(ConversationParticipant.user_id != user_id)
                .distinct()
                .all()
            )
            other_user_ids = [p[0] for p in other_participants]
            
            for other_id in other_user_ids:
                if other_id in self.active_connections:
                    await self.send_personal_message(
                        {
                            "type": "presence_update",
                            "data": {
                                "user_id": user_id,
                                "is_online": is_online,
                                "last_seen": last_seen.isoformat(),
                            },
                        },
                        other_id,
                    )
        except Exception:
            pass
        finally:
            db.close()
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """
        Accept a new WebSocket connection.
        
        If user already has a connection, close the old one.
        This ensures one connection per user.
        Also updates the user's is_online status in the database.
        """
        await websocket.accept()
        
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].close()
            except:
                pass
        
        self.active_connections[user_id] = websocket
        self.user_conversations[user_id] = set()
        
        # Update user's online status in the database
        db = SessionLocal()
        last_seen = datetime.utcnow()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.is_online = True
                user.last_seen = last_seen
                db.commit()
        finally:
            db.close()
            
        await self.broadcast_presence(user_id, True, last_seen)
    
    async def disconnect(self, user_id: int):
        """
        Remove a user's connection when they disconnect.
        Also updates is_online to False and sets last_seen in the database.
        """
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.user_conversations:
            del self.user_conversations[user_id]
        
        # Update user's offline status in the database
        db = SessionLocal()
        last_seen = datetime.utcnow()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.is_online = False
                user.last_seen = last_seen
                db.commit()
        finally:
            db.close()
            
        await self.broadcast_presence(user_id, False, last_seen)
    
    async def send_personal_message(self, message: dict, user_id: int):
        """Send a message to a specific user."""
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except:
                await self.disconnect(user_id)
    
    async def broadcast_to_conversation(
        self,
        conversation_id: int,
        message: dict,
        exclude_user: Optional[int] = None,
    ):
        """
        Broadcast a message to all participants in a conversation.
        
        Args:
            conversation_id: The conversation to broadcast to
            message: The message dict to send
            exclude_user: Optional user_id to skip (e.g., the sender)
        """
        db = SessionLocal()
        try:
            participants = (
                db.query(ConversationParticipant)
                .filter(ConversationParticipant.conversation_id == conversation_id)
                .all()
            )
            
            participant_ids = [p.user_id for p in participants]
            
            for user_id in participant_ids:
                if exclude_user and user_id == exclude_user:
                    continue
                await self.send_personal_message(message, user_id)
        finally:
            db.close()
    
    def is_user_viewing_conversation(self, user_id: int, conversation_id: int) -> bool:
        """Check if a user currently has a conversation open."""
        return (
            user_id in self.user_conversations and
            conversation_id in self.user_conversations[user_id]
        )
    
    async def set_user_viewing(self, user_id: int, conversation_id: int):
        """Mark that a user is viewing a specific conversation."""
        if user_id not in self.user_conversations:
            self.user_conversations[user_id] = set()
        self.user_conversations[user_id].add(conversation_id)
    
    async def remove_user_viewing(self, user_id: int, conversation_id: int):
        """Mark that a user is no longer viewing a conversation."""
        if user_id in self.user_conversations:
            self.user_conversations[user_id].discard(conversation_id)


manager = ConnectionManager()


async def handle_chat_message(
    user_id: int,
    conversation_id: int,
    content: str,
) -> dict:
    """
    Save a chat message to the database and return the saved message.
    
    FLOW:
    1. Verify user is a participant
    2. Create Message with status='sent'
    3. Broadcast to other participants
    4. Return the message with full details
    """
    db = SessionLocal()
    try:
        participant = (
            db.query(ConversationParticipant)
            .filter(
                ConversationParticipant.conversation_id == conversation_id,
                ConversationParticipant.user_id == user_id,
            )
            .first()
        )
        
        if not participant:
            return {"error": "Not a participant in this conversation"}
        
        message = Message(
            conversation_id=conversation_id,
            sender_id=user_id,
            content=content,
            timestamp=datetime.utcnow(),
            status=MessageStatus.sent,
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        
        sender = db.query(User).filter(User.id == user_id).first()
        
        return {
            "id": message.id,
            "conversation_id": message.conversation_id,
            "sender_id": message.sender_id,
            "sender_name": sender.display_name if sender else None,
            "content": message.content,
            "timestamp": message.timestamp.isoformat(),
            "status": message.status.value,
        }
    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    finally:
        db.close()


async def handle_status_update(
    message_id: int,
    new_status: MessageStatus,
) -> Optional[dict]:
    """
    Update a message's delivery status.
    
    Used for:
    - Marking as 'delivered' when received by recipient's device
    - Marking as 'read' when recipient opens the conversation
    """
    db = SessionLocal()
    try:
        message = db.query(Message).filter(Message.id == message_id).first()
        
        if not message:
            return None
        
        status_order = [MessageStatus.sending, MessageStatus.sent, MessageStatus.delivered, MessageStatus.read]
        current_idx = status_order.index(message.status)
        new_idx = status_order.index(new_status)
        
        if new_idx > current_idx:
            message.status = new_status
            db.commit()
        
        return {
            "message_id": message.id,
            "status": message.status.value,
        }
    except Exception as e:
        db.rollback()
        return None
    finally:
        db.close()


async def websocket_handler(websocket: WebSocket, user_id: int):
    """
    Main WebSocket message handler.
    
    MESSAGE TYPES:
    - chat: Send a message to a conversation
    - typing: Notify others that user is typing
    - status_update: Update message delivery status
    - view_conversation: Mark that user is viewing a conversation
    """
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
            except json.JSONDecodeError:
                await manager.send_personal_message(
                    {"error": "Invalid JSON"},
                    user_id,
                )
                continue
            
            msg_type = message.get("type")
            msg_data = message.get("data", {})
            
            if msg_type == "chat":
                conversation_id = msg_data.get("conversation_id")
                content = msg_data.get("content")
                
                if not conversation_id or not content:
                    await manager.send_personal_message(
                        {"error": "Missing conversation_id or content"},
                        user_id,
                    )
                    continue
                
                saved_msg = await handle_chat_message(
                    user_id,
                    conversation_id,
                    content,
                )
                
                if "error" in saved_msg:
                    await manager.send_personal_message(saved_msg, user_id)
                else:
                    await manager.broadcast_to_conversation(
                        conversation_id,
                        {
                            "type": "chat",
                            "data": saved_msg,
                        },
                        exclude_user=user_id,
                    )
                    
                    await manager.send_personal_message(
                        {
                            "type": "chat",
                            "data": saved_msg,
                        },
                        user_id,
                    )
            
            elif msg_type == "typing":
                conversation_id = msg_data.get("conversation_id")
                is_typing = msg_data.get("is_typing", True)
                
                if conversation_id:
                    db = SessionLocal()
                    try:
                        sender = db.query(User).filter(User.id == user_id).first()
                        await manager.broadcast_to_conversation(
                            conversation_id,
                            {
                                "type": "typing",
                                "data": {
                                    "conversation_id": conversation_id,
                                    "user_id": user_id,
                                    "user_name": sender.display_name if sender else None,
                                    "is_typing": is_typing,
                                },
                            },
                            exclude_user=user_id,
                        )
                    finally:
                        db.close()
            
            elif msg_type == "status_update":
                message_id = msg_data.get("message_id")
                status_str = msg_data.get("status")
                
                if message_id and status_str:
                    try:
                        new_status = MessageStatus(status_str)
                        result = await handle_status_update(message_id, new_status)
                        
                        if result:
                            db = SessionLocal()
                            try:
                                msg = db.query(Message).filter(Message.id == message_id).first()
                                if msg:
                                    await manager.broadcast_to_conversation(
                                        msg.conversation_id,
                                        {
                                            "type": "status_update",
                                            "data": result,
                                        },
                                    )
                            finally:
                                db.close()
                    except ValueError:
                        pass
            
            elif msg_type == "view_conversation":
                conversation_id = msg_data.get("conversation_id")
                is_viewing = msg_data.get("is_viewing", True)
                
                if conversation_id:
                    if is_viewing:
                        await manager.set_user_viewing(user_id, conversation_id)
                        
                        # Mark all unread messages from OTHER users as "read"
                        # so the unread count resets in the database (persists on refresh)
                        db = SessionLocal()
                        try:
                            unread_messages = (
                                db.query(Message)
                                .filter(
                                    Message.conversation_id == conversation_id,
                                    Message.sender_id != user_id,
                                    Message.status != MessageStatus.read,
                                )
                                .all()
                            )
                            
                            for msg in unread_messages:
                                msg.status = MessageStatus.read
                                # Broadcast status update to the sender
                                await manager.send_personal_message(
                                    {
                                        "type": "status_update",
                                        "data": {
                                            "message_id": msg.id,
                                            "status": "read",
                                        },
                                    },
                                    msg.sender_id,
                                )
                            
                            if unread_messages:
                                db.commit()
                        finally:
                            db.close()
                    else:
                        await manager.remove_user_viewing(user_id, conversation_id)
    
    except WebSocketDisconnect:
        await manager.disconnect(user_id)
    except Exception as e:
        await manager.disconnect(user_id)
