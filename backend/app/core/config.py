import os

class Settings:
    PROJECT_NAME: str = "Collaborative Review Workspace"
    SQLALCHEMY_DATABASE_URI: str = os.getenv("DATABASE_URL", "postgresql://postgres:Pubvision_123@localhost:5432/GenerationView")
    SECRET_KEY: str = "super_secret_key_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    UPLOAD_DIR: str = "uploads"
    GOOGLE_CLOUD_BUCKET: str = os.getenv("GOOGLE_CLOUD_BUCKET", "pubvision_storage")
    GOOGLE_APPLICATION_CREDENTIALS: str = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", ".gcp_credentials.json")

settings = Settings()
