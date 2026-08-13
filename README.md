# Signal Clone - SDE Fullstack Assignment

A functional clone of the Signal messaging application, replicating its modern design, user experience, and core messaging workflows. Built with a focus on clean, scalable architecture and real-time communication.

## 🚀 Features

- **Authentication**: Multi-step registration flow with phone number, mock OTP verification, and profile setup.
- **Real-Time Messaging**: Instant 1:1 and group messaging powered by WebSockets.
- **Group Chats**: Create groups, manage members (add/remove), and group avatars.
- **Read Receipts**: Real-time read receipts (viewing a conversation marks unread messages as read).
- **Online Presence**: Real-time online/offline status and "last seen" tracking.
- **Typing Indicators**: See when others are typing in real-time.
- **Modern UI/UX**: Replicates the clean, privacy-focused design of Signal Desktop/Web, complete with dynamic layouts, micro-animations, and toast notifications.
- **Search**: Global search to find existing conversations and discover new contacts.

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Real-time**: Native WebSocket API

### Backend
- **Framework**: Python with FastAPI
- **Database**: SQLite (managed via SQLAlchemy ORM)
- **Real-time**: FastAPI WebSockets (`ConnectionManager`)
- **Schema Validation**: Pydantic

## 📦 Project Structure

```
.
├── backend/
│   ├── app/
│   │   ├── routes/       # API endpoints (auth, conversations, groups, users)
│   │   ├── database.py   # SQLAlchemy configuration
│   │   ├── models.py     # Database schema definitions
│   │   ├── schemas.py    # Pydantic models for validation
│   │   ├── websocket.py  # WebSocket connection manager & event handling
│   │   └── main.py       # FastAPI application entry point
│   ├── main.db           # SQLite database
│   └── requirements.txt  # Python dependencies
└── frontend/
    ├── src/
    │   ├── app/          # Next.js App Router (layout, page)
    │   ├── components/   # Reusable UI components (MessageBubble, Modals, etc.)
    │   ├── hooks/        # Custom React hooks (useWebSocket)
    │   ├── lib/          # API client wrappers
    │   ├── store/        # Zustand state stores
    │   └── types/        # TypeScript interfaces
    ├── package.json      # Node dependencies
    └── tailwind.config.ts# Tailwind styling configuration
```

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- Python 3.9+

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *The API will be available at http://localhost:8000*

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The app will be available at http://localhost:3000*

## 📚 API Reference (Highlights)

### Authentication
- `POST /auth/login`: Authenticate an existing user.
- `POST /auth/register`: Initiate user registration.
- `POST /auth/verify-otp`: Verify OTP and receive JWT.
- `PUT /auth/profile`: Update user display name and avatar.

### Conversations & Messaging
- `GET /conversations`: Fetch all user conversations (1:1 and groups) with unread counts.
- `GET /conversations/{id}/messages`: Fetch paginated messages for a conversation.
- `POST /conversations/direct`: Create or fetch a 1:1 conversation with a target user.

### Groups
- `POST /groups`: Create a new group with specified participants.
- `GET /groups/{id}/members`: Fetch all members of a group.
- `POST /groups/{id}/members`: Add a user to a group (Admin only).
- `DELETE /groups/{id}/members/{user_id}`: Remove a member (Admin only).
- `POST /groups/{id}/leave`: Leave a group.

### WebSocket Events
- `send_message`: Broadcasts a message to conversation participants.
- `typing_indicator`: Broadcasts typing state to conversation participants.
- `view_conversation`: Marks unread messages as read and broadcasts updates.
- `presence_update`: Broadcasts online/offline status changes.

## 📝 Design Decisions

- **Idempotent Mock Auth**: Real E2E encryption and phone verification are mocked. Registration sets up user profiles, and OTP is statically validated (code: `123456`) to ensure a smooth demo experience.
- **Polling vs WebSockets**: WebSockets are leveraged heavily for real-time presence, read receipts, and messaging to replicate Signal's instantaneous feel. 
- **Zustand over Context**: Zustand is used for global state management (app context, toast notifications) due to its minimal boilerplate and excellent performance.
- **SQLite threading**: `check_same_thread: False` is enabled in SQLAlchemy to prevent issues with FastAPI's concurrency model when handling WebSockets and HTTP requests simultaneously.
