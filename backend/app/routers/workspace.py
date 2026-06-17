from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from app import schemas, models, database
from app.routers.auth import get_current_user
from typing import List, Optional
import shutil
import os
from uuid import uuid4, UUID
from app.core.config import settings
from app.core.storage import save_uploaded_file

router = APIRouter(prefix="/workspace", tags=["workspace"])

@router.get("/assets")
def get_assets(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    # Returns combined data: Publications and their Generations
    publications = db.query(models.Publication).filter(models.Publication.uploaded_by == current_user.id).options(joinedload(models.Publication.generations)).all()
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
    pdf_file: UploadFile = File(...),
    video_file: Optional[UploadFile] = File(None),
    ppt_file: Optional[UploadFile] = File(None),
    poster_file: Optional[UploadFile] = File(None),
    audio_file: Optional[UploadFile] = File(None),
    infographic_file: Optional[UploadFile] = File(None),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):

        
    # Collate uploaded files
    files = {
        models.AssetType.Video: video_file,
        models.AssetType.PPT: ppt_file,
        models.AssetType.Poster: poster_file,
        models.AssetType.Audio: audio_file,
        models.AssetType.Infographic: infographic_file,
    }
    
    valid_uploads = {k: v for k, v in files.items() if v is not None and getattr(v, 'filename', '') != ''}
    
    if not valid_uploads:
        raise HTTPException(status_code=400, detail="Please upload at least one generated asset file (Video, PPT, Poster, Audio, or Infographic).")
    
    # Save PDF
    pdf_url = save_uploaded_file(pdf_file)
    
    # Create Publication
    new_pub = models.Publication(
        title=title,
        pdf_url=pdf_url,
        uploaded_by=current_user.id
    )
    db.add(new_pub)
    db.commit()
    db.refresh(new_pub)
    
    # Create Generation for each uploaded asset
    generation_ids = []
    for asset_type, file_obj in valid_uploads.items():
        gen_url = save_uploaded_file(file_obj)
        new_gen = models.Generation(
            publication_id=new_pub.id,
            audience_level=audience_level,
            asset_type=asset_type,
            generation_url=gen_url,
            uploaded_by=getattr(current_user, 'current_name', 'Unknown')
        )
        db.add(new_gen)
        db.commit()
        db.refresh(new_gen)
        generation_ids.append(str(new_gen.id))
        
    return {
        "message": "Assets created successfully", 
        "publication_id": str(new_pub.id), 
        "generation_ids": generation_ids
    }

@router.delete("/assets/{generation_id}")
def delete_asset(
    generation_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    generation = db.query(models.Generation).filter(models.Generation.id == generation_id).first()
    if not generation:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    pub = db.query(models.Publication).filter(models.Publication.id == generation.publication_id).first()
    if pub and pub.uploaded_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this asset")
        
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
