from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models import AudienceLevel, AssetType

class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str
    role: Optional[str] = 'viewer'

class UserResponse(UserBase):
    id: UUID
    role: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class CommentBase(BaseModel):
    comment_text: str

class CommentCreate(CommentBase):
    parent_id: Optional[UUID] = None

class CommentResponse(CommentBase):
    id: UUID
    generation_id: UUID
    user_id: Optional[UUID]
    parent_id: Optional[UUID] = None
    created_at: datetime
    user: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

class GenerationBase(BaseModel):
    audience_level: AudienceLevel
    asset_type: AssetType
    generation_url: str

class GenerationCreate(GenerationBase):
    publication_id: UUID

class GenerationResponse(GenerationBase):
    id: UUID
    publication_id: UUID
    created_at: datetime
    comments: List[CommentResponse] = []
    
    class Config:
        from_attributes = True

class PublicationBase(BaseModel):
    title: str
    pdf_url: str

class PublicationCreate(PublicationBase):
    pass

class PublicationResponse(PublicationBase):
    id: UUID
    uploaded_by: Optional[UUID]
    created_at: datetime
    generations: List[GenerationResponse] = []
    
    class Config:
        from_attributes = True

class SlideCommentBase(BaseModel):
    comment_text: str

class SlideCommentCreate(SlideCommentBase):
    pass

class SlideCommentResponse(SlideCommentBase):
    id: UUID
    slide_submission_id: UUID
    user_id: Optional[UUID]
    created_at: datetime
    user: Optional[UserResponse] = None
    
    class Config:
        from_attributes = True

class SlideSubmissionBase(BaseModel):
    title: str
    client_slide_url: str
    production_slide_url: str
    recreated_slide_url: str

class SlideSubmissionResponse(SlideSubmissionBase):
    id: UUID
    uploaded_by: Optional[UUID]
    created_at: datetime
    comments: List[SlideCommentResponse] = []
    
    class Config:
        from_attributes = True
