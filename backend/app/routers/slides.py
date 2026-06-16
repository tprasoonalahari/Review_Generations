from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session, joinedload
from app import schemas, models, database
from app.routers.auth import get_current_user
from app.core.storage import save_uploaded_file
from typing import List
from uuid import UUID

router = APIRouter(prefix="/slides", tags=["slides"])

@router.get("", response_model=List[schemas.SlideSubmissionResponse])
def get_slide_submissions(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    # Returns all slide submissions
    submissions = db.query(models.SlideSubmission).options(
        joinedload(models.SlideSubmission.comments).joinedload(models.SlideComment.user)
    ).order_by(models.SlideSubmission.created_at.desc()).all()
    
    # Map to schemas manually or let FastAPI handle it. 
    # Since we have relationship backref, let's ensure it maps cleanly
    return submissions

@router.post("", status_code=status.HTTP_201_CREATED)
def create_slide_submission(
    title: str = Form(...),
    client_slide: UploadFile = File(...),
    production_slide: UploadFile = File(...),
    recreated_slide: UploadFile = File(...),
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check that all files are PPTX
    for f in [client_slide, production_slide, recreated_slide]:
        ext = os_ext = f.filename.split('.')[-1].lower() if '.' in f.filename else ''
        if ext != 'pptx':
            raise HTTPException(
                status_code=400, 
                detail=f"All files must be in .pptx format only. Invalid file: {f.filename}"
            )
            
    # Save files using storage helper
    client_url = save_uploaded_file(client_slide)
    production_url = save_uploaded_file(production_slide)
    recreated_url = save_uploaded_file(recreated_slide)
    
    # Create submission record
    new_submission = models.SlideSubmission(
        title=title,
        client_slide_url=client_url,
        production_slide_url=production_url,
        recreated_slide_url=recreated_url,
        uploaded_by=current_user.id
    )
    
    db.add(new_submission)
    db.commit()
    db.refresh(new_submission)
    
    return {
        "message": "Slide submission created successfully",
        "id": new_submission.id,
        "title": new_submission.title
    }

@router.get("/{submission_id}")
def get_slide_submission_detail(
    submission_id: UUID, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    submission = db.query(models.SlideSubmission)\
        .filter(models.SlideSubmission.id == submission_id)\
        .options(
            joinedload(models.SlideSubmission.comments).joinedload(models.SlideComment.user)
        )\
        .first()
        
    if not submission:
        raise HTTPException(status_code=404, detail="Slide submission not found")
        
    uploader = db.query(models.User).filter(models.User.id == submission.uploaded_by).first()
    uploader_email = uploader.email if uploader else "Unknown"
        
    return {
        "id": submission.id,
        "title": submission.title,
        "client_slide_url": submission.client_slide_url,
        "production_slide_url": submission.production_slide_url,
        "recreated_slide_url": submission.recreated_slide_url,
        "uploaded_by_email": uploader_email,
        "created_at": submission.created_at,
        "comments": [
            {
                "id": c.id,
                "text": c.comment_text,
                "created_at": c.created_at,
                "user": c.user.email if c.user else "Unknown"
            } for c in submission.comments
        ]
    }

@router.post("/{submission_id}/comments", response_model=schemas.SlideCommentResponse)
def add_slide_comment(
    submission_id: UUID,
    comment: schemas.SlideCommentCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    submission = db.query(models.SlideSubmission).filter(models.SlideSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Slide submission not found")
        
    new_comment = models.SlideComment(
        slide_submission_id=submission_id,
        user_id=current_user.id,
        comment_text=comment.comment_text
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment

@router.put("/comments/{comment_id}", response_model=schemas.SlideCommentResponse)
def update_slide_comment(
    comment_id: UUID,
    comment_update: schemas.SlideCommentCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    comment = db.query(models.SlideComment).filter(models.SlideComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to edit this comment")
        
    comment.comment_text = comment_update.comment_text
    db.commit()
    db.refresh(comment)
    return comment

@router.delete("/comments/{comment_id}")
def delete_slide_comment(
    comment_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    comment = db.query(models.SlideComment).filter(models.SlideComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="You do not have permission to delete this comment")
        
    db.delete(comment)
    db.commit()
    return {"detail": "Comment deleted successfully"}

@router.delete("/{submission_id}")
def delete_slide_submission(
    submission_id: UUID,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ['admin', 'creator']:
        raise HTTPException(status_code=403, detail="Not authorized to delete submissions")
        
    submission = db.query(models.SlideSubmission).filter(models.SlideSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Slide submission not found")
        
    db.delete(submission)
    db.commit()
    return {"message": "Slide submission deleted successfully"}
