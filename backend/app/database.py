# ============================================================
#  database.py
#  -------------
#  Central place for the SQLAlchemy engine, session factory,
#  and the declarative Base class.
#
#  WHY THIS FILE EXISTS
#  --------------------
#  Every part of the app that touches the database (models,
#  API routes, seed script, WebSocket handlers) imports from
#  here. Keeping the engine + session setup in ONE file means
#  there is a single source of truth for "how do we talk to
#  the database".
# ============================================================

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# ------------------------------------------------------------------
# 1. DATABASE URL
# ------------------------------------------------------------------
#  SQLite is a file-based database. The `./` means "relative to the
#  current working directory", so this creates a file called
#  `signal_clone.db` next to where the server is started from.
#  (For this project we deliberately keep it simple with SQLite;
#  swapping to Postgres later would just mean changing this URL.)
DATABASE_URL = "sqlite:///./signal_clone.db"

# ------------------------------------------------------------------
# 2. ENGINE
# ------------------------------------------------------------------
#  The engine is the lowest-level connection to the database.
#  SQLAlchemy uses it to open connections, run SQL, and fetch rows.
#
#  `connect_args={"check_same_thread": False}` is a SQLite-specific
#  setting. By default SQLite only allows a connection to be used
#  from the thread that created it. FastAPI runs request handlers
#  in a thread pool, so we disable that check to avoid errors.
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

# ------------------------------------------------------------------
# 3. SESSION FACTORY
# ------------------------------------------------------------------
#  A "session" is a short-lived handle for a single unit of work
#  (e.g. "save this message"). The factory below creates new
#  sessions on demand. We use it instead of creating sessions
#  manually so every part of the app gets identically-configured
#  sessions.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ------------------------------------------------------------------
# 4. DECLARATIVE BASE
# ------------------------------------------------------------------
#  Every model (User, Conversation, ...) will inherit from this
#  class. SQLAlchemy reads the model definitions and turns them
#  into actual CREATE TABLE statements. One Base = one shared
#  registry of tables.
class Base(DeclarativeBase):
    """Base class for all ORM models in this project."""


# ------------------------------------------------------------------
# 5. FASTAPI DEPENDENCY: get_db
# ------------------------------------------------------------------
#  FastAPI lets us declare "dependencies" that run before a request.
#  Every route that needs the database will declare `db: Session =
#  Depends(get_db)` and receive a ready-to-use session.
#
#  The `yield` pattern is important: after the request finishes,
#  FastAPI runs whatever comes after `yield`, which closes the
#  session so we never leak open connections.
def get_db():
    """Yield a database session, then close it after the request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
