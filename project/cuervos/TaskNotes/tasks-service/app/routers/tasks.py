from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.database.postgres import get_db
from app.models.postgres_models import Task
from app.schemas.task_schemas import Task as TaskSchema, TaskCreate, TaskUpdate, PaginatedResponse
from app.services.serialization import serialize_task
from app.services.events import publish_event

router = APIRouter(prefix="/tasks", tags=["tasks"])


def get_current_user_id(x_user_id: Optional[int] = Header(default=None)) -> int:
    """Obtiene el user_id desde cabecera `X-User-Id` o usa 1 por defecto."""
    return x_user_id or 1

@router.get("/", response_model=PaginatedResponse[TaskSchema])
def read_tasks(page: int = 1, size: int = 20, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    skip = (page - 1) * size
    total = db.query(Task).filter(Task.user_id == user_id).count()
    tasks = db.query(Task).filter(Task.user_id == user_id).offset(skip).limit(size).all()
    items = [serialize_task(t, user_id) for t in tasks]
    pages = (total + size - 1) // size
    return {"items": items, "total": total, "page": page, "size": size, "pages": pages}

@router.post("/", response_model=TaskSchema, status_code=201)
def create_task(task_in: TaskCreate, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    db_task = Task(
        title=task_in.title,
        description=task_in.description,
        priority=task_in.priority,
        due_date=task_in.due_date,
        user_id=user_id,
    )
    # Category
    if task_in.category_id and task_in.category_id.strip():
        try:
            cid = int(task_in.category_id)
            db_task.category_id = cid
        except (ValueError, TypeError):
            pass
    # Tags
    if task_in.tag_ids:
        tag_ints = []
        for tid in task_in.tag_ids:
            try:
                tag_ints.append(int(tid))
            except (ValueError, TypeError):
                continue
        db_task.tag_ids = tag_ints
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    publish_event("task.created", {
        "event_type": "created",
        "entity": "task",
        "user_id": user_id,
        "id": db_task.id,
        "title": db_task.title,
    })
    return serialize_task(db_task, user_id)

@router.get("/{task_id}", response_model=TaskSchema)
def read_task(task_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return serialize_task(task, user_id)

@router.put("/{task_id}", response_model=TaskSchema)
def update_task(task_id: int, patch: TaskUpdate, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if patch.title is not None:
        task.title = patch.title
    if patch.description is not None:
        task.description = patch.description
    if patch.completed is not None:
        task.completed = patch.completed
    if patch.priority is not None:
        task.priority = patch.priority
    if patch.due_date is not None:
        task.due_date = patch.due_date
    # Category
    if patch.category_id is not None:
        if patch.category_id and patch.category_id.strip():
            try:
                cid = int(patch.category_id)
                task.category_id = cid
            except (ValueError, TypeError):
                task.category_id = None
        else:
            task.category_id = None
    # Tags replace set when provided
    if patch.tag_ids is not None:
        tag_ints = []
        for tid in patch.tag_ids:
            try:
                tag_ints.append(int(tid))
            except (ValueError, TypeError):
                continue
        task.tag_ids = tag_ints
    db.commit()
    db.refresh(task)
    publish_event("task.updated", {
        "event_type": "updated",
        "entity": "task",
        "user_id": user_id,
        "id": task.id,
    })
    return serialize_task(task, user_id)

@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    publish_event("task.deleted", {
        "event_type": "deleted",
        "entity": "task",
        "user_id": user_id,
        "id": task_id,
    })
    return None