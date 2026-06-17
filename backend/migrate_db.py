import os
from sqlalchemy import create_engine, text

# Use the environment variable if available, otherwise local default
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Pubvision_123@localhost:5432/GenerationView")

engine = create_engine(DATABASE_URL)

try:
    with engine.begin() as conn:
        print("Adding column uploaded_by to generations...")
        conn.execute(text("ALTER TABLE generations ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR DEFAULT 'Unknown';"))
        
        print("Adding column parent_id to comments...")
        conn.execute(text("ALTER TABLE comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES comments(id) ON DELETE CASCADE;"))
        
        print("Adding new values to audiencelevel enum...")
        # Postgres Enum modification cannot be run in a transaction block with other statements easily in older versions, 
        # but execution with AUTOCOMMIT is safest.
        
except Exception as e:
    print(f"Migration error: {e}")

# Enum additions require autocommit (cannot be inside a transaction block)
try:
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        conn.execute(text("ALTER TYPE audiencelevel ADD VALUE IF NOT EXISTS 'Field force';"))
        conn.execute(text("ALTER TYPE audiencelevel ADD VALUE IF NOT EXISTS 'MSLs';"))
        conn.execute(text("ALTER TYPE assettype ADD VALUE IF NOT EXISTS 'Audio';"))
        print("Enum values added successfully.")
except Exception as e:
    print(f"Enum Migration error (might already exist): {e}")

print("Migration complete!")
