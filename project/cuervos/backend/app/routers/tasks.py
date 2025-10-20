"""
Endpoints para gestionar tareas en PostgreSQL.

Características clave:
- Paginación en listados
- Conversión de `category_id` y `tag_ids` (strings) a enteros para BD
- Respuestas con `category` y `tags` expandidos (id, name, color)
- Emite eventos WebSocket al crear/actualizar/eliminar

Cómo usar desde frontend:
- Enviar `category_id` y `tag_ids` como strings
- `due_date` puede ir en ISO (o null)
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.models.postgres_models import User, Task, Tag, Category
from app.schemas.task_schemas import Task as TaskSchema, TaskCreate, TaskUpdate, PaginatedResponse
from app.core.security import get_current_active_user
from app.websocket import sio

router = APIRouter()


def serialize_task(task: Task) -> dict:
    """Convierte un modelo `Task` a dict listo para respuesta API.

    Incluye:
    - category: { id, name, color } o None
    - tags: [{ id, name, color }]
    - fechas en ISO cuando aplica
    """
    category_obj = None
    if task.category is not None:
        category_obj = {
            "id": str(task.category.id),
            "name": task.category.name,
            "color": task.category.color,
        }

    tags_list = []
    for t in task.tags or []:
        tags_list.append({
            "id": str(t.id),
            "name": t.name,
            "color": getattr(t, "color", None),
        })

    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "completed": task.completed,
        "priority": task.priority,
        "category": category_obj,
        "tags": tags_list,
        "due_date": task.due_date.isoformat() if task.due_date else None,
        "user_id": task.user_id,
        "created_at": task.created_at.isoformat() if hasattr(task.created_at, 'isoformat') else task.created_at,
        "updated_at": task.updated_at.isoformat() if task.updated_at and hasattr(task.updated_at, 'isoformat') else (task.updated_at or None),
    }

@router.get("/", response_model=PaginatedResponse[TaskSchema])
async def read_tasks(
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Lista tareas del usuario autenticado con paginación."""
    # Calculate offset
    skip = (page - 1) * size
    
    # Get total count
    total = db.query(Task).filter(Task.user_id == current_user.id).count()
    
    # Get tasks with pagination
    tasks = db.query(Task).filter(Task.user_id == current_user.id).offset(skip).limit(size).all()
    
    # Convert to schema format with expanded category/tags
    task_list = [serialize_task(task) for task in tasks]
    
    # Calculate pages
    pages = (total + size - 1) // size
    
    return {
        "items": task_list,
        "total": total,
        "page": page,
        "size": size,
        "pages": pages
    }

@router.post("/", response_model=TaskSchema)
async def create_task(
    task: TaskCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Crea una tarea para el usuario actual.

    - Convierte `category_id`/`tag_ids` (strings) a enteros para persistir
    - Emite evento `task_created`
    """
    print(f"Creating task with data: {task}")
    # Create task
    db_task = Task(
        title=task.title,
        description=task.description,
        priority=task.priority,
        due_date=task.due_date,
        user_id=current_user.id
    )
    
    # Handle category
    if task.category_id and task.category_id.strip():
        try:
            category_id = int(task.category_id)
            from app.models.postgres_models import Category
            category = db.query(Category).filter(Category.id == category_id).first()
            if category:
                db_task.category_id = category_id
        except (ValueError, TypeError):
            pass  # Invalid category_id, skip
    
    # Handle tags
    if task.tag_ids and len(task.tag_ids) > 0:
        for tag_id in task.tag_ids:
            try:
                tag_id_int = int(tag_id)
                tag = db.query(Tag).filter(Tag.id == tag_id_int).first()
                if tag:
                    db_task.tags.append(tag)
            except (ValueError, TypeError):
                continue  # Invalid tag_id, skip
    
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    
    # Prepare response with expanded objects
    task_dict = serialize_task(db_task)
    
    # Emit WebSocket event
    await sio.emit('task_created', task_dict, room=f"user_{current_user.id}")
    
    return task_dict

@router.get("/{task_id}", response_model=TaskSchema)
async def read_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Obtiene una tarea por id si pertenece al usuario actual."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_dict = serialize_task(task)
    
    return task_dict

@router.put("/{task_id}", response_model=TaskSchema)
async def update_task(
    task_id: int,
    task_update: TaskUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Actualiza campos de una tarea.

    - Si `category_id` viene vacío o inválido, se remueve la categoría
    - Reemplaza por completo el conjunto de `tags` cuando `tag_ids` viene
    - Emite evento `task_updated`
    """
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Update fields
    if task_update.title is not None:
        task.title = task_update.title
    if task_update.description is not None:
        task.description = task_update.description
    if task_update.completed is not None:
        task.completed = task_update.completed
    if task_update.priority is not None:
        task.priority = task_update.priority
    if task_update.due_date is not None:
        task.due_date = task_update.due_date
    
    # Handle category update
    if task_update.category_id is not None:
        if task_update.category_id and task_update.category_id.strip():
            try:
                category_id = int(task_update.category_id)
                from app.models.postgres_models import Category
                category = db.query(Category).filter(Category.id == category_id).first()
                if category:
                    task.category_id = category_id
                else:
                    task.category_id = None
            except (ValueError, TypeError):
                task.category_id = None
        else:
            task.category_id = None
    
    # Handle tags update
    if task_update.tag_ids is not None:
        # Clear existing tags
        task.tags.clear()
        # Add new tags
        if task_update.tag_ids and len(task_update.tag_ids) > 0:
            for tag_id in task_update.tag_ids:
                try:
                    tag_id_int = int(tag_id)
                    tag = db.query(Tag).filter(Tag.id == tag_id_int).first()
                    if tag:
                        task.tags.append(tag)
                except (ValueError, TypeError):
                    continue  # Invalid tag_id, skip
    
    db.commit()
    db.refresh(task)
    
    # Prepare response
    task_dict = serialize_task(task)
    
    # Emit WebSocket event
    await sio.emit('task_updated', task_dict, room=f"user_{current_user.id}")
    
    return task_dict

@router.delete("/{task_id}")
async def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Elimina una tarea del usuario y emite `task_deleted`."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    
    # Emit WebSocket event
    await sio.emit('task_deleted', {"id": task_id}, room=f"user_{current_user.id}")
    
    return {"message": "Task deleted successfully"}