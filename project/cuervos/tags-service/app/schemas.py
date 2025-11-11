from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict

# Pydantic v2 config to support ORM conversion
class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# Tags
class TagCreate(BaseModel):
    name: str
    color: Optional[str] = None
    description: Optional[str] = None


class TagUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None


class TagRead(ORMModel):
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# Categories
class CategoryCreate(BaseModel):
    name: str
    color: Optional[str] = None
    description: Optional[str] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    description: Optional[str] = None


class CategoryRead(ORMModel):
    id: int
    user_id: int
    name: str
    description: Optional[str] = None
    color: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# Attach/Detach tags to categories
class AttachTagRequest(BaseModel):
    tag_id: int