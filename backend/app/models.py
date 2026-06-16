from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Enum, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, backref
import uuid
from app.database import Base
import enum

class AudienceLevel(str, enum.Enum):
    Field_force = 'Field force'
    MSLs = 'MSLs'
    Doctor = 'Doctor'
    HCP = 'HCP'
    Professional = 'Professional'
    Patient = 'Patient'
    Scientist = 'Scientist'

class AssetType(str, enum.Enum):
    Video = 'Video'
    PPT = 'PPT'
    Poster = 'Poster'
    Infographic = 'Infographic'

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default='viewer')
    created_at = Column(DateTime, default=func.now())
    
    publications = relationship("Publication", back_populates="uploader")
    comments = relationship("Comment", back_populates="user")

class Publication(Base):
    __tablename__ = "publications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    pdf_url = Column(Text, nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    created_at = Column(DateTime, default=func.now())
    
    uploader = relationship("User", back_populates="publications")
    generations = relationship("Generation", back_populates="publication", cascade="all, delete-orphan")

class Generation(Base):
    __tablename__ = "generations"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    publication_id = Column(UUID(as_uuid=True), ForeignKey('publications.id', ondelete='CASCADE'))
    audience_level = Column(Enum(AudienceLevel), nullable=False)
    asset_type = Column(Enum(AssetType), nullable=False)
    generation_url = Column(Text, nullable=False)
    uploaded_by = Column(String, default="Unknown")
    created_at = Column(DateTime, default=func.now())
    
    publication = relationship("Publication", back_populates="generations")
    comments = relationship("Comment", back_populates="generation", cascade="all, delete-orphan")

class Comment(Base):
    __tablename__ = "comments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    generation_id = Column(UUID(as_uuid=True), ForeignKey('generations.id', ondelete='CASCADE'))
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'))
    parent_id = Column(UUID(as_uuid=True), ForeignKey('comments.id', ondelete='CASCADE'), nullable=True)
    comment_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())
    
    generation = relationship("Generation", back_populates="comments")
    user = relationship("User", back_populates="comments")
    replies = relationship("Comment", backref=backref('parent', remote_side=[id]), cascade="all, delete-orphan")

class SlideSubmission(Base):
    __tablename__ = "slide_submissions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    client_slide_url = Column(Text, nullable=False)
    production_slide_url = Column(Text, nullable=False)
    recreated_slide_url = Column(Text, nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    created_at = Column(DateTime, default=func.now())
    
    uploader = relationship("User", backref="slide_submissions")
    comments = relationship("SlideComment", back_populates="slide_submission", cascade="all, delete-orphan")

class SlideComment(Base):
    __tablename__ = "slide_comments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slide_submission_id = Column(UUID(as_uuid=True), ForeignKey('slide_submissions.id', ondelete='CASCADE'))
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    comment_text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=func.now())
    
    slide_submission = relationship("SlideSubmission", back_populates="comments")
    user = relationship("User", backref="slide_comments")
