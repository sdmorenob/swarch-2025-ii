from pydantic import BaseModel
from typing import Optional, List, Generic, TypeVar
from datetime import datetime

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    size: int
    pages: int

class NoteBase(BaseModel):
    title: str
    content: str
    category_id: Optional[str] = None
    tag_ids: List[str] = []

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category_id: Optional[str] = None
    tag_ids: Optional[List[str]] = None

class TagSummary(BaseModel):
    id: str
    name: str
    color: Optional[str] = None

class CategorySummary(BaseModel):
    id: str
    name: str
    color: Optional[str] = None

class Note(BaseModel):
    id: str
    title: str
    content: str
    user_id: int
    created_at: datetime
    updated_at: datetime
    category_id: Optional[str] = None
    tag_ids: List[str] = []
    category: Optional[CategorySummary] = None
    tags: List[TagSummary] = []