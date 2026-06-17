from app.database import engine, Base, SessionLocal
from app.models import User
from app.core import security
import os

def init():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    admin_email = "admin@pubvision.com"
    admin_user = db.query(User).filter(User.email == admin_email).first()
    
    if not admin_user:
        print("Creating default admin user: admin@pubvision.com / admin123")
        hashed_password = security.get_password_hash("admin123")
        new_admin = User(email=admin_email, password_hash=hashed_password, role="admin")
        db.add(new_admin)
        db.commit()
    else:
        print("Admin user already exists.")
        
    # Delete old team_uploader user if it exists
    old_uploader = db.query(User).filter(User.email == "team_uploader@pubvision.com").first()
    if old_uploader:
        print("Removing old team_uploader@pubvision.com user...")
        db.delete(old_uploader)
        db.commit()

    # Create Reviewer user
    reviewer_email = "Reviewer"
    reviewer_user = db.query(User).filter(User.email == reviewer_email).first()
    if not reviewer_user:
        print(f"Creating default reviewer user: {reviewer_email} / Reviewer123")
        hashed_password = security.get_password_hash("Reviewer123")
        new_reviewer = User(email=reviewer_email, password_hash=hashed_password, role="creator")
        db.add(new_reviewer)
        db.commit()
    else:
        print("Reviewer user already exists.")
        
    db.close()

if __name__ == "__main__":
    init()
