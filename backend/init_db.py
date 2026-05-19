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
        
    db.close()

if __name__ == "__main__":
    init()
