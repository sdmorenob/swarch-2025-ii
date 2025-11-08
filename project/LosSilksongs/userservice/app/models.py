from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, Text, Index
from .database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), nullable=False, unique=True, index=True)
    email = Column(String(254), unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    profile_picture_url = Column(String, nullable=False, default="")
    bio = Column(Text, nullable=False, default="")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    is_active = Column(Boolean, default=True, nullable=False)
    
    __table_args__ = (
        Index('ix_users_email_active', 'email', 'is_active'),
    )