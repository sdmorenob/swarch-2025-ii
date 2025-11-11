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

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"  # low, medium, high
    category_id: Optional[str] = None
    tag_ids: List[str] = []
    due_date: Optional[datetime] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    priority: Optional[str] = None
    category_id: Optional[str] = None
    tag_ids: Optional[List[str]] = None
    due_date: Optional[datetime] = None

class TagSummary(BaseModel):
    id: str
    name: str
    color: Optional[str] = None

class CategorySummary(BaseModel):
    id: str
    name: str
    color: Optional[str] = None

class Task(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    completed: bool
    priority: str
    due_date: Optional[datetime] = None
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    status: Optional[str] = None
    category: Optional[CategorySummary] = None
    tags: List[TagSummary] = []