import os
import shutil
import urllib.request
from uuid import uuid4
from fastapi import UploadFile
from app.core.config import settings

# Attempt to import google cloud storage, but be resilient if it fails
try:
    from google.cloud import storage
    GCS_AVAILABLE = True
except ImportError:
    GCS_AVAILABLE = False

# Global flag to track if GCS is failing/unavailable to avoid repeated timeouts
GCS_DISABLED_TEMPORARILY = False

if GCS_AVAILABLE:
    try:
        # Fast internet/Google API reachability check to avoid blocking local runs
        with urllib.request.urlopen("https://oauth2.googleapis.com", timeout=1.5):
            pass
    except Exception as e:
        print(f"Google APIs are unreachable ({e}). Disabling GCS and forcing local storage fallback.")
        GCS_DISABLED_TEMPORARILY = True

def save_uploaded_file(upload_file: UploadFile) -> str:
    """
    Saves an uploaded file. Attempts to save to Google Cloud Storage (GCS) if credentials
    and bucket are configured. Otherwise, falls back to saving it locally in the backend's
    static uploads directory.
    Returns the URL/path to access the file.
    """
    global GCS_DISABLED_TEMPORARILY
    filename = f"{uuid4()}_{upload_file.filename}"
    
    # Try GCS upload first if configured and not marked as failing
    if GCS_AVAILABLE and settings.GOOGLE_CLOUD_BUCKET and not GCS_DISABLED_TEMPORARILY:
        try:
            # Set credentials env variable if configured in settings
            if settings.GOOGLE_APPLICATION_CREDENTIALS and os.path.exists(settings.GOOGLE_APPLICATION_CREDENTIALS):
                os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.GOOGLE_APPLICATION_CREDENTIALS
                
            storage_client = storage.Client()
            bucket = storage_client.bucket(settings.GOOGLE_CLOUD_BUCKET)
            blob_path = f"uploads/{filename}"
            blob = bucket.blob(blob_path)
            
            # Reset seek position to start of file
            upload_file.file.seek(0)
            blob.upload_from_file(upload_file.file, content_type=upload_file.content_type, timeout=3.0)
            
            # GCS URL
            return f"https://storage.googleapis.com/{settings.GOOGLE_CLOUD_BUCKET}/{blob_path}"
        except Exception as e:
            print(f"GCS upload failed, disabling GCS for this session and falling back to local file storage: {e}")
            GCS_DISABLED_TEMPORARILY = True
    
    # Local fallback
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    local_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    upload_file.file.seek(0)
    with open(local_path, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
        
    # Return path relative to server root
    return f"/uploads/{filename}"
