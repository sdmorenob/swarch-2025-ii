"""
Esquemas Pydantic para etiquetas (tags).
"""

from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TagBase(BaseModel):
    name: str
    color: str
    description: Optional[str] = None

class TagCreate(TagBase):
    pass

class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None

class TagInDB(TagBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

class Tag(TagInDB):
    class Config:
        from_attributes = True