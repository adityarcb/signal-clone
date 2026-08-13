# ============================================================
#  main.py
#  -------
#  FastAPI application entry point.
#
#  This is the file you run to start the backend server:
#      uvicorn app.main:app --reload
#
#  WHAT THIS DOES
#  --------------
#  1. Creates the FastAPI app instance
#  2. Configures CORS (so the frontend can call the API)
#  3. Includes all route modules (auth, conversations, users, groups)
#  4. Provides a health check endpoint
# ============================================================

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.auth import router as auth_router, decode_mock_token
from app.routes.conversations import router as conversations_router
from app.routes.users import router as users_router
from app.routes.groups import router as groups_router
from app.websocket import websocket_handler

# ------------------------------------------------------------------
# CREATE TABLES (if they don't exist)
# ------------------------------------------------------------------
#  This ensures the database schema is ready when the server starts.
#  In production, you might use Alembic migrations instead.
Base.metadata.create_all(bind=engine)

# ------------------------------------------------------------------
# CREATE FASTAPI APP
# ------------------------------------------------------------------
app = FastAPI(
    title="Signal Clone API",
    description="A Signal-like messaging application backend",
    version="1.0.0",
)

# ------------------------------------------------------------------
# CONFIGURE CORS
# ------------------------------------------------------------------
#  CORS (Cross-Origin Resource Sharing) allows the frontend (running
#  on a different port) to make requests to this backend.
#
#  In development:
#    - Frontend runs on http://localhost:3000
#    - Backend runs on http://localhost:8000
#  Without CORS, the browser would block these requests.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# INCLUDE ROUTERS
# ------------------------------------------------------------------
#  Each router handles a specific domain:
#    - auth_router: /auth/login, /auth/me
#    - conversations_router: /conversations, /conversations/{id}/messages
#    - users_router: /users/search
#    - groups_router: POST /groups
app.include_router(auth_router)
app.include_router(conversations_router)
app.include_router(users_router)
app.include_router(groups_router)


# ------------------------------------------------------------------
# HEALTH CHECK ENDPOINT
# ------------------------------------------------------------------
@app.get("/", tags=["Health"])
def health_check():
    """Simple endpoint to verify the server is running."""
    return {"status": "ok", "message": "Signal Clone API is running"}


@app.get("/health", tags=["Health"])
def health():
    """Alternative health check endpoint."""
    return {"healthy": True}


# ------------------------------------------------------------------
# WEBSOCKET ENDPOINT
# ------------------------------------------------------------------
@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="Authentication token"),
):
    """
    WebSocket endpoint for real-time messaging.
    
    CONNECTION:
    1. Client connects with: ws://host/ws?token=XXX
    2. Server validates token to get user_id
    3. Connection is stored in ConnectionManager
    
    MESSAGE TYPES (send/receive):
    - chat: Send/receive chat messages
    - typing: Typing indicators
    - status_update: Message delivery/read receipts
    - view_conversation: Track which conversation user is viewing
    """
    user_id = decode_mock_token(token)
    
    if user_id is None:
        await websocket.close(code=4001, reason="Invalid token")
        return
    
    await websocket_handler(websocket, user_id)
