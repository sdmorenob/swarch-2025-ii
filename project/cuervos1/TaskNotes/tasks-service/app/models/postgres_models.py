from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import ARRAY
from app.database.postgres import Base

class Task(Base):
    __tablename__ = "tasks"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    completed = Column(Boolean, default=False)
    priority = Column(String, default="medium")  # low, medium, high
    due_date = Column(DateTime(timezone=True))
    user_id = Column(Integer)
    category_id = Column(Integer)
    tag_ids = Column(ARRAY(Integer))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())