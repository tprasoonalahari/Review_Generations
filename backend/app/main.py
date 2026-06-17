from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import auth, workspace, review, slides
from app.database import engine, Base
from app.core.config import settings
import os

from sqlalchemy import text

# Create DB tables
Base.metadata.create_all(bind=engine)

# Auto-migrate schema changes
try:
    with engine.begin() as conn:
        conn.execute(text("SET local lock_timeout = '2000';")) # Fail-fast after 2 seconds if lock is held
        conn.execute(text("ALTER TABLE generations ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR DEFAULT 'Unknown';"))
        conn.execute(text("ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;"))
except Exception as e:
    print(f"Migration error (column might exist or lock timeout): {e}")

try:
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        conn.execute(text("SET lock_timeout = '2000';")) # Fail-fast after 2 seconds if lock is held
        conn.execute(text("ALTER TYPE audiencelevel ADD VALUE IF NOT EXISTS 'Field force';"))
        conn.execute(text("ALTER TYPE audiencelevel ADD VALUE IF NOT EXISTS 'MSLs';"))
        conn.execute(text("ALTER TYPE assettype ADD VALUE IF NOT EXISTS 'Audio';"))
except Exception as e:
    print(f"Enum Migration error (values might exist or lock timeout): {e}")

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(workspace.router)
app.include_router(review.router)
app.include_router(slides.router)

@app.get("/")
def root():
    return {"message": "Welcome to the Collaborative Review Workspace API"}
