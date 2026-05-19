from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import schemas, models, database
from app.routers.auth import get_current_user
from uuid import UUID

router = APIRouter(prefix="/review", tags=["review"])

@router.get("/{generation_id}")
def get_review_data(generation_id: UUID, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    generation = db.query(models.Generation).filter(models.Generation.id == generation_id).first()
    if not generation:
        raise HTTPException(status_code=404, detail="Generation not found")
    
    return {
        "publication": {
            "title": generation.publication.title,
            "pdf_url": generation.publication.pdf_url
        },
        "generation": {
            "id": generation.id,
            "audience_level": generation.audience_level,
            "asset_type": generation.asset_type,
            "generation_url": generation.generation_url
        },
        "comments": [
            {
                "id": c.id,
                "text": c.comment_text,
                "created_at": c.created_at,
                "user": c.user.email if c.user else "Unknown"
            } for c in generation.comments
        ]
    }

@router.post("/{generation_id}/comments", response_model=schemas.CommentResponse)
def add_comment(generation_id: UUID, comment: schemas.CommentCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    generation = db.query(models.Generation).filter(models.Generation.id == generation_id).first()
    if not generation:
        raise HTTPException(status_code=404, detail="Generation not found")
        
    new_comment = models.Comment(
        generation_id=generation_id,
        user_id=current_user.id,
        comment_text=comment.comment_text
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment
