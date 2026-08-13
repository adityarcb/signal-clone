#!/usr/bin/env python3
# ============================================================
#  seed.py
#  -------
#  Populate the database with sample data for development.
#
#  WHAT THIS CREATES
#  -----------------
#  - 4 users (Alice, Bob, Charlie, Diana)
#  - 2 direct conversations (Alice-Bob, Charlie-Diana)
#  - 1 group conversation (Team Chat with all 4 users)
#  - 25+ historical messages spread across the conversations
#
#  HOW TO RUN
#  ----------
#  From the `backend/` directory:
#      python seed.py
#
#  This will:
#    1. Create the SQLite file (`signal_clone.db`) if it doesn't exist.
#    2. Create all tables (users, conversations, etc.).
#    3. Insert the sample data.
# ============================================================

from datetime import datetime, timedelta
import random

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, DATABASE_URL
from app.models import User, Conversation, ConversationParticipant, Message, MessageStatus


def create_seed_data():
    """Create and return all seed objects (users, conversations, messages)."""

    # ------------------------------------------------------------------
    # 1. CREATE USERS
    # ------------------------------------------------------------------
    #  Each user has a phone number (used for mock login) and a display
    #  name. We'll use placeholder avatar URLs from ui-avatars.com.
    users = [
        User(
            phone_number="+1555000001",
            display_name="Alice Johnson",
            avatar_url="https://ui-avatars.com/api/?name=Alice+Johnson&background=3b82f6&color=fff",
            is_online=True,
            last_seen=datetime.utcnow(),
        ),
        User(
            phone_number="+1555000002",
            display_name="Bob Smith",
            avatar_url="https://ui-avatars.com/api/?name=Bob+Smith&background=10b981&color=fff",
            is_online=True,
            last_seen=datetime.utcnow(),
        ),
        User(
            phone_number="+1555000003",
            display_name="Charlie Davis",
            avatar_url="https://ui-avatars.com/api/?name=Charlie+Davis&background=f59e0b&color=fff",
            is_online=False,
            last_seen=datetime.utcnow() - timedelta(hours=2),
        ),
        User(
            phone_number="+1555000004",
            display_name="Diana Evans",
            avatar_url="https://ui-avatars.com/api/?name=Diana+Evans&background=ef4444&color=fff",
            is_online=True,
            last_seen=datetime.utcnow(),
        ),
    ]
    return users


def create_conversations_and_messages(users):
    """Create conversations, participants, and messages."""
    
    alice, bob, charlie, diana = users

    # ------------------------------------------------------------------
    # 2. CREATE CONVERSATIONS
    # ------------------------------------------------------------------
    #  We need 2 direct (1:1) conversations and 1 group conversation.
    conv_alice_bob = Conversation(
        is_group=False,
        name=None,
        created_at=datetime.utcnow() - timedelta(days=5),
    )
    conv_charlie_diana = Conversation(
        is_group=False,
        name=None,
        created_at=datetime.utcnow() - timedelta(days=3),
    )
    conv_team_group = Conversation(
        is_group=True,
        name="Team Chat",
        created_at=datetime.utcnow() - timedelta(days=7),
    )

    # ------------------------------------------------------------------
    # 3. CREATE PARTICIPANTS
    # ------------------------------------------------------------------
    #  For direct conversations, each user is just a participant.
    #  For groups, we mark Alice as admin (she "created" the group).
    participants = [
        ConversationParticipant(conversation=conv_alice_bob, user=alice, is_admin=False),
        ConversationParticipant(conversation=conv_alice_bob, user=bob, is_admin=False),
        ConversationParticipant(conversation=conv_charlie_diana, user=charlie, is_admin=False),
        ConversationParticipant(conversation=conv_charlie_diana, user=diana, is_admin=False),
        ConversationParticipant(conversation=conv_team_group, user=alice, is_admin=True),
        ConversationParticipant(conversation=conv_team_group, user=bob, is_admin=False),
        ConversationParticipant(conversation=conv_team_group, user=charlie, is_admin=False),
        ConversationParticipant(conversation=conv_team_group, user=diana, is_admin=False),
    ]

    # ------------------------------------------------------------------
    # 4. CREATE MESSAGES
    # ------------------------------------------------------------------
    #  We'll create messages with staggered timestamps so the UI can
    #  show a realistic chat history. Status progresses: sent -> delivered -> read.
    base_time = datetime.utcnow() - timedelta(hours=2)

    messages = []

    # --- Alice-Bob conversation (8 messages) ---
    ab_messages = [
        (alice, "Hey Bob! How's the project going?"),
        (bob, "Hi Alice! It's coming along nicely. Almost done with the backend."),
        (alice, "That's great to hear! Let me know if you need any help."),
        (bob, "Thanks! I might take you up on that for the WebSocket stuff."),
        (alice, "Sure thing. I've worked with FastAPI WebSockets before."),
        (bob, "Perfect. Let's sync up tomorrow morning?"),
        (alice, "Sounds good. 10 AM works for me."),
        (bob, "See you then! 🚀"),
    ]
    for i, (sender, text) in enumerate(ab_messages):
        status = MessageStatus.read if i < len(ab_messages) - 1 else MessageStatus.delivered
        messages.append(Message(
            conversation=conv_alice_bob,
            sender=sender,
            content=text,
            timestamp=base_time + timedelta(minutes=i * 3),
            status=status,
        ))

    # --- Charlie-Diana conversation (6 messages) ---
    cd_messages = [
        (charlie, "Diana, did you see the new design mockups?"),
        (diana, "Yes! They look amazing. The UI is so clean."),
        (charlie, "Right? I especially like the message bubbles."),
        (diana, "The gradient on the sent messages is a nice touch."),
        (charlie, "I'll implement the frontend components tomorrow."),
        (diana, "Cool, I'll handle the state management with Zustand."),
    ]
    base_cd = base_time + timedelta(minutes=30)
    for i, (sender, text) in enumerate(cd_messages):
        status = MessageStatus.read if i < len(cd_messages) - 1 else MessageStatus.delivered
        messages.append(Message(
            conversation=conv_charlie_diana,
            sender=sender,
            content=text,
            timestamp=base_cd + timedelta(minutes=i * 5),
            status=status,
        ))

    # --- Team Chat group (12 messages) ---
    group_messages = [
        (alice, "Welcome everyone to the team chat! 👋"),
        (bob, "Thanks for setting this up Alice!"),
        (charlie, "Great to have a dedicated space for discussions."),
        (diana, "This will make coordination so much easier."),
        (alice, "Let's use this for daily standups too."),
        (bob, "Good idea. Should we do async standups here?"),
        (charlie, "Works for me. I'm usually deep in code in the mornings."),
        (diana, "Same here. Async is better for focus time."),
        (alice, "Let's try it for a week and see how it goes."),
        (bob, "Quick question: what's the deadline for Phase 1?"),
        (alice, "End of this week. We're on track!"),
        (charlie, "I'll push the database changes by EOD."),
        (diana, "Frontend scaffolding will be ready by Thursday."),
    ]
    base_group = base_time - timedelta(days=1)
    for i, (sender, text) in enumerate(group_messages):
        status = MessageStatus.read
        messages.append(Message(
            conversation=conv_team_group,
            sender=sender,
            content=text,
            timestamp=base_group + timedelta(minutes=i * 10),
            status=status,
        ))

    # Collect all conversations for return
    conversations = [conv_alice_bob, conv_charlie_diana, conv_team_group]
    
    return conversations, participants, messages


def main():
    """Main entry point for the seed script."""
    
    print("=" * 60)
    print("  SIGNAL CLONE - Database Seed Script")
    print("=" * 60)

    # ------------------------------------------------------------------
    # STEP 1: Create engine and session
    # ------------------------------------------------------------------
    #  We create a fresh engine here (instead of importing from database.py)
    #  because this script may run before the app ever starts.
    print("\n[1/4] Creating database engine...")
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # ------------------------------------------------------------------
    # STEP 2: Create all tables
    # ------------------------------------------------------------------
    #  This reads the models (User, Conversation, etc.) and generates
    #  CREATE TABLE statements. If tables already exist, it does nothing.
    print("[2/4] Creating tables (if they don't exist)...")
    Base.metadata.create_all(bind=engine)

    # ------------------------------------------------------------------
    # STEP 3: Create a session and add seed data
    # ------------------------------------------------------------------
    print("[3/4] Populating database with seed data...")
    db = SessionLocal()
    try:
        # Check if we already have data (avoid duplicates on re-run)
        existing_users = db.query(User).count()
        if existing_users > 0:
            print(f"\n  ⚠️  Database already contains {existing_users} users.")
            print("  Skipping seed to avoid duplicates. Delete signal_clone.db to re-seed.")
            return

        # Create the objects
        users = create_seed_data()
        conversations, participants, messages = create_conversations_and_messages(users)

        # Add everything to the session
        #  We add users first because conversations/messages reference them via FK.
        db.add_all(users)
        db.add_all(conversations)
        db.add_all(participants)
        db.add_all(messages)

        # Commit the transaction
        db.commit()

        # ------------------------------------------------------------------
        # STEP 4: Verify the data was inserted
        # ------------------------------------------------------------------
        print("[4/4] Verifying seed data...\n")
        print(f"  ✓ Users created: {db.query(User).count()}")
        print(f"  ✓ Conversations created: {db.query(Conversation).count()}")
        print(f"  ✓ Participants created: {db.query(ConversationParticipant).count()}")
        print(f"  ✓ Messages created: {db.query(Message).count()}")

        print("\n" + "=" * 60)
        print("  ✅ Seed complete! Database is ready for development.")
        print("=" * 60)

    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
