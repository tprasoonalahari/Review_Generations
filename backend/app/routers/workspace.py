from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from app import schemas, models, database
from app.routers.auth import get_current_user
from typing import List
import shutil
import os
from uuid import uuid4, UUID
from app.core.config import settings
from google.cloud import storage

router = APIRouter(prefix="/workspace", tags=["workspace"])

if settings.GOOGLE_APPLICATION_CREDENTIALS:
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.GOOGLE_APPLICATION_CREDENTIALS

@router.get("/assets")
def get_assets(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    # Returns combined data: Publications and their Generations
    publications = db.query(models.Publication).options(joinedload(models.Publication.generations)).all()
    result = []
    for pub in publications:
        for gen in pub.generations:
            result.append({
                "publication_id": pub.id,
                "publication_title": pub.title,
                "pdf_url": pub.pdf_url,
                "generation_id": gen.id,
                "audience_level": gen.audience_level,
                "asset_type": gen.asset_type,
                "generation_url": gen.generation_url,
                "uploaded_by": getattr(gen, "uploaded_by", "Unknown"),
                "created_at": gen.created_at
            })
    return result

@router.post("/assets")
def create_asset(
    title: str = Form(...),
    audience_level: models.AudienceLevel = Form(...),
    asset_type: models.AssetType = Form(...),
    pdf_file: UploadFile = File(...),
    asset_file: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ['admin', 'creator']:
        raise HTTPException(status_code=403, detail="Not authorized to create assets")
    
    storage_client = storage.Client()
    bucket = storage_client.bucket(settings.GOOGLE_CLOUD_BUCKET)
    
    # Save PDF to GCS
    pdf_filename = f"uploads/{uuid4()}_{pdf_file.filename}"
    pdf_blob = bucket.blob(pdf_filename)
    pdf_blob.upload_from_file(pdf_file.file, content_type=pdf_file.content_type)
        
    # Save Asset File to GCS
    asset_filename = f"uploads/{uuid4()}_{asset_file.filename}"
    asset_blob = bucket.blob(asset_filename)
    asset_blob.upload_from_file(asset_file.file, content_type=asset_file.content_type)
        
    # Create DB records with GCS URLs
    pdf_url = f"https://storage.googleapis.com/{settings.GOOGLE_CLOUD_BUCKET}/{pdf_filename}"
    generation_url = f"https://storage.googleapis.com/{settings.GOOGLE_CLOUD_BUCKET}/{asset_filename}"
    
    new_pub = models.Publication(
        title=title,
        pdf_url=pdf_url,
        uploaded_by=current_user.id
    )
    db.add(new_pub)
    db.commit()
    db.refresh(new_pub)
    
    new_gen = models.Generation(
        publication_id=new_pub.id,
        audience_level=audience_level,
        asset_type=asset_type,
        generation_url=generation_url,
        uploaded_by=getattr(current_user, 'current_name', 'Unknown')
    )
    db.add(new_gen)
    db.commit()
    db.refresh(new_gen)
    
    return {"message": "Asset created successfully", "publication_id": new_pub.id, "generation_id": new_gen.id}

@router.delete("/assets/{generation_id}")
def delete_asset(
    generation_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ['admin', 'creator']:
        raise HTTPException(status_code=403, detail="Not authorized to delete assets")
        
    generation = db.query(models.Generation).filter(models.Generation.id == generation_id).first()
    if not generation:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    pub_id = generation.publication_id
    db.delete(generation)
    
    # Check if publication has other generations, if not, delete it too
    other_gens = db.query(models.Generation).filter(models.Generation.publication_id == pub_id).count()
    if other_gens == 0:
        pub = db.query(models.Publication).filter(models.Publication.id == pub_id).first()
        if pub:
            db.delete(pub)
            
    db.commit()
    return {"message": "Asset deleted successfully"}
