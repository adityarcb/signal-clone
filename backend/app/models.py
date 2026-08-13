# ============================================================
#  models.py
#  ---------
#  ORM (Object-Relational Mapping) definitions for our tables.
#
#  HOW IT WORKS
#  ------------
#  Each class below represents a table in SQLite. When we call
#  `Base.metadata.create_all(engine)`, SQLAlchemy reads these
#  classes and generates the actual SQL CREATE TABLE statements.
#
#  RELATIONSHIPS EXPLAINED
#  -----------------------
#  - User <-> Conversation: Many-to-Many via ConversationParticipant
#    (A user can be in many conversations, a conversation can have
#    many users.)
#  - User -> Message: One-to-Many (A user sends many messages.)
#  - Conversation -> Message: One-to-Many (A conversation has many
#    messages.)
# ============================================================

from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base

# ------------------------------------------------------------------
# ENUM FOR MESSAGE STATUS
# ------------------------------------------------------------------
#  In Signal you see: single tick (sent), double tick (delivered),
#  filled double tick (read). We store this as an enum in the DB.
import enum


class MessageStatus(str, enum.Enum):
    """Possible delivery states for a message."""
    sending = "sending"      # User pressed send, but not yet acknowledged by server
    sent = "sent"            # Server received and saved it
    delivered = "delivered"  # Recipient's device acknowledged receipt
    read = "read"            # Recipient opened the conversation


# ------------------------------------------------------------------
# USER MODEL
# ------------------------------------------------------------------
#  Represents a person who can log in and send messages.
#
#  Columns:
#    id            - Auto-incremented integer primary key.
#    phone_number  - Unique identifier (mocked; no real SMS verification).
#    display_name  - What others see in chat headers.
#    avatar_url    - Optional URL to a profile picture.
#    is_online     - Updated by WebSocket connect/disconnect.
#    last_seen     - Updated when user goes offline.
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    phone_number: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(100))
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    is_online: Mapped[bool] = mapped_column(Boolean, default=False)
    last_seen: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # ------------------------------------------------------------------
    # RELATIONSHIPS (SQLAlchemy magic)
    # ------------------------------------------------------------------
    #  `relationship()` lets us navigate from a User object to related
    #  objects without writing JOINs manually.
    #
    #  - participants: All ConversationParticipant rows for this user.
    #  - messages: All Message rows sent by this user.
    participants: Mapped[List["ConversationParticipant"]] = relationship(
        "ConversationParticipant", back_populates="user", cascade="all, delete-orphan"
    )
    messages: Mapped[List["Message"]] = relationship(
        "Message", back_populates="sender", cascade="all, delete-orphan"
    )


# ------------------------------------------------------------------
# CONVERSATION MODEL
# ------------------------------------------------------------------
#  A conversation can be:
#    - Direct (1:1): is_group=False, name is None.
#    - Group: is_group=True, name is the group title.
#
#  Columns:
#    id         - Auto-incremented primary key.
#    is_group   - True if this is a group chat.
#    name       - Group name (None for direct chats).
#    created_at - When the conversation was created.
class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    is_group: Mapped[bool] = mapped_column(Boolean, default=False)
    name: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    participants: Mapped[List["ConversationParticipant"]] = relationship(
        "ConversationParticipant", back_populates="conversation", cascade="all, delete-orphan"
    )
    messages: Mapped[List["Message"]] = relationship(
        "Message", back_populates="conversation", cascade="all, delete-orphan"
    )


# ------------------------------------------------------------------
# CONVERSATION PARTICIPANT MODEL (JUNCTION TABLE)
# ------------------------------------------------------------------
#  This table implements the many-to-many relationship between
#  Users and Conversations.
#
#  WHY A SEPARATE TABLE?
#  ----------------------
#  In a direct chat, exactly two rows exist in this table (one per
#  participant). In a group, there can be many rows, and we also
#  store `is_admin` to track who can add/remove members.
#
#  Columns:
#    conversation_id - FK to conversations.id.
#    user_id         - FK to users.id.
#    is_admin        - True if this user can manage the group.
#
#  Note: (conversation_id, user_id) is the composite primary key.
class ConversationParticipant(Base):
    __tablename__ = "conversation_participants"

    conversation_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("conversations.id"), primary_key=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), primary_key=True
    )
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relationships (back_populates matches the names in User/Conversation)
    conversation: Mapped["Conversation"] = relationship(
        "Conversation", back_populates="participants"
    )
    user: Mapped["User"] = relationship("User", back_populates="participants")


# ------------------------------------------------------------------
# MESSAGE MODEL
# ------------------------------------------------------------------
#  The core entity: a single text message in a conversation.
#
#  Columns:
#    id             - Auto-incremented primary key.
#    conversation_id- FK to conversations.id (which chat this belongs to).
#    sender_id      - FK to users.id (who sent it).
#    content        - The actual text (using Text for potentially long msgs).
#    timestamp      - When the message was sent (server time).
#    status         - Delivery state (sending -> sent -> delivered -> read).
class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    conversation_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("conversations.id"), index=True
    )
    sender_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    content: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    status: Mapped[MessageStatus] = mapped_column(
        Enum(MessageStatus), default=MessageStatus.sent
    )

    # Relationships
    conversation: Mapped["Conversation"] = relationship(
        "Conversation", back_populates="messages"
    )
    sender: Mapped["User"] = relationship("User", back_populates="messages")
