"""
Endpoints para gestionar notas en MongoDB con enriquecimiento desde PostgreSQL.

Notas se guardan en MongoDB por flexibilidad y velocidad; categorías y etiquetas
se expanden desde PostgreSQL para retornar `{id,name,color}` en las respuestas.

Características:
- Paginación y búsqueda básica (regex por título/contenido, match por tag_ids)
- Historial de cambios por cada nota (colección `note_history`)
- Emisión de eventos WebSocket al crear/actualizar/eliminar
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from bson import ObjectId
from sqlalchemy.orm import Session

from app.database.mongodb import get_collection
from app.database.postgres import get_db
from app.models.mongodb_models import NoteModel, NoteHistoryModel
from app.models.postgres_models import User, Category, Tag
from app.schemas.note_schemas import Note as NoteSchema, NoteCreate, NoteUpdate, PaginatedResponse
from app.core.security import get_current_active_user
from app.websocket import sio

router = APIRouter()

async def expand_note_data(note_dict: dict, db: Session):
    """Expande `category` y `tags` (id, name, color) desde Postgres.

    - Lee `category_id` y `tag_ids` (strings) y busca en Postgres
    - Adjunta `category` y `tags` listos para el front
    """
    print(f"Expanding note data: {note_dict}")
    # Expand category
    if note_dict.get("category_id"):
        try:
            category_id = int(note_dict["category_id"])
            print(f"Looking for category with id: {category_id}")
            category = db.query(Category).filter(Category.id == category_id).first()
            print(f"Found category: {category}")
            if category:
                note_dict["category"] = {
                    "id": str(category.id),
                    "name": category.name,
                    "color": category.color
                }
                print(f"Expanded category: {note_dict['category']}")
            else:
                note_dict["category"] = None
                print("Category not found")
        except (ValueError, TypeError) as e:
            print(f"Error expanding category: {e}")
            note_dict["category"] = None
    else:
        note_dict["category"] = None
    
    # Expand tags
    if note_dict.get("tag_ids") and note_dict["tag_ids"]:
        tags = []
        print(f"Expanding tags: {note_dict['tag_ids']}")
        for tag_id in note_dict["tag_ids"]:
            try:
                tag_id_int = int(tag_id)
                print(f"Looking for tag with id: {tag_id_int}")
                tag = db.query(Tag).filter(Tag.id == tag_id_int).first()
                print(f"Found tag: {tag}")
                if tag:
                    tag_obj = {
                        "id": str(tag.id),
                        "name": tag.name,
                        "color": tag.color
                    }
                    tags.append(tag_obj)
                    print(f"Added tag: {tag_obj}")
            except (ValueError, TypeError) as e:
                print(f"Error expanding tag {tag_id}: {e}")
                continue
        note_dict["tags"] = tags
        print(f"Final tags: {note_dict['tags']}")
    else:
        note_dict["tags"] = []
        print("No tags to expand")
    
    return note_dict

@router.get("/", response_model=PaginatedResponse[NoteSchema])
async def read_notes(
    page: int = 1,
    size: int = 20,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Lista notas del usuario con paginación y filtro `search` opcional."""
    collection = get_collection("notes")
    
    # Build query
    query = {"user_id": current_user.id}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}},
            {"tag_ids": {"$in": [search]}}
        ]
    
    # Calculate offset
    skip = (page - 1) * size
    
    # Get total count
    total = await collection.count_documents(query)
    
    # Execute query with pagination
    cursor = collection.find(query).skip(skip).limit(size).sort("updated_at", -1)
    notes = await cursor.to_list(length=size)
    
    # Convert to schema format
    note_list = []
    for note in notes:
        note_dict = {
            "id": str(note["_id"]),
            "title": note["title"],
            "content": note["content"],
            "category_id": note.get("category_id"),
            "tag_ids": note.get("tag_ids", []),
            "user_id": note["user_id"],
            "created_at": note["created_at"],
            "updated_at": note["updated_at"]
        }
        note_dict = await expand_note_data(note_dict, db)
        note_list.append(note_dict)
    
    # Calculate pages
    pages = (total + size - 1) // size
    
    return {
        "items": note_list,
        "total": total,
        "page": page,
        "size": size,
        "pages": pages
    }

@router.post("/", response_model=NoteSchema)
async def create_note(
    note: NoteCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Crea una nota en MongoDB y registra historial.

    - Guarda `category_id` y `tag_ids` como strings
    - Enriquecimiento: expande `category` y `tags` desde Postgres
    - Emite evento `note_created`
    """
    collection = get_collection("notes")
    
    # Create note document
    note_doc = {
        "title": note.title,
        "content": note.content,
        "category_id": note.category_id if note.category_id and note.category_id.strip() else None,
        "tag_ids": note.tag_ids if note.tag_ids and len(note.tag_ids) > 0 else [],
        "user_id": current_user.id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    # Insert note
    result = await collection.insert_one(note_doc)
    note_doc["_id"] = result.inserted_id
    
    # Create history entry
    history_collection = get_collection("note_history")
    history_doc = {
        "note_id": result.inserted_id,
        "action": "created",
        "changes": note_doc.copy(),
        "user_id": current_user.id,
        "timestamp": datetime.utcnow()
    }
    await history_collection.insert_one(history_doc)
    
    # Prepare response
    note_dict = {
        "id": str(note_doc["_id"]),
        "title": note_doc["title"],
        "content": note_doc["content"],
        "category_id": note_doc["category_id"],
        "tag_ids": note_doc["tag_ids"],
        "user_id": note_doc["user_id"],
        "created_at": note_doc["created_at"].isoformat(),
        "updated_at": note_doc["updated_at"].isoformat()
    }
    
    # Expand category and tag data
    note_dict = await expand_note_data(note_dict, db)
    
    # Emit WebSocket event
    await sio.emit('note_created', note_dict, room=f"user_{current_user.id}")
    
    return note_dict

@router.get("/{note_id}", response_model=NoteSchema)
async def read_note(
    note_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Obtiene una nota por id (Mongo) del usuario actual y la expande."""
    collection = get_collection("notes")
    
    try:
        note = await collection.find_one({
            "_id": ObjectId(note_id),
            "user_id": current_user.id
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid note ID")
    
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    
    note_dict = {
        "id": str(note["_id"]),
        "title": note["title"],
        "content": note["content"],
        "category_id": note.get("category_id"),
        "tag_ids": note.get("tag_ids", []),
        "user_id": note["user_id"],
        "created_at": note["created_at"],
        "updated_at": note["updated_at"]
    }
    
    note_dict = await expand_note_data(note_dict, db)
    return note_dict

@router.put("/{note_id}", response_model=NoteSchema)
async def update_note(
    note_id: str,
    note_update: NoteUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Actualiza una nota en MongoDB y registra historial de cambios.

    - `category_id` vacío -> None; `tag_ids` vacío -> []
    - Emite evento `note_updated`
    """
    collection = get_collection("notes")
    
    try:
        # Get existing note
        existing_note = await collection.find_one({
            "_id": ObjectId(note_id),
            "user_id": current_user.id
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid note ID")
    
    if existing_note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Prepare update data
    update_data = {"updated_at": datetime.utcnow()}
    changes = {}
    
    if note_update.title is not None:
        update_data["title"] = note_update.title
        changes["title"] = {"old": existing_note["title"], "new": note_update.title}
    if note_update.content is not None:
        update_data["content"] = note_update.content
        changes["content"] = {"old": existing_note["content"], "new": note_update.content}
    if note_update.category_id is not None:
        new_category_id = note_update.category_id if note_update.category_id and note_update.category_id.strip() else None
        update_data["category_id"] = new_category_id
        changes["category_id"] = {"old": existing_note.get("category_id"), "new": new_category_id}
    if note_update.tag_ids is not None:
        new_tag_ids = note_update.tag_ids if note_update.tag_ids and len(note_update.tag_ids) > 0 else []
        update_data["tag_ids"] = new_tag_ids
        changes["tag_ids"] = {"old": existing_note.get("tag_ids", []), "new": new_tag_ids}
    
    # Update note
    await collection.update_one(
        {"_id": ObjectId(note_id)},
        {"$set": update_data}
    )
    
    # Create history entry
    if changes:
        history_collection = get_collection("note_history")
        history_doc = {
            "note_id": ObjectId(note_id),
            "action": "updated",
            "changes": changes,
            "user_id": current_user.id,
            "timestamp": datetime.utcnow()
        }
        await history_collection.insert_one(history_doc)
    
    # Get updated note
    updated_note = await collection.find_one({"_id": ObjectId(note_id)})
    
    # Prepare response
    note_dict = {
        "id": str(updated_note["_id"]),
        "title": updated_note["title"],
        "content": updated_note["content"],
        "category_id": updated_note.get("category_id"),
        "tag_ids": updated_note.get("tag_ids", []),
        "user_id": updated_note["user_id"],
        "created_at": updated_note["created_at"].isoformat(),
        "updated_at": updated_note["updated_at"].isoformat()
    }
    
    # Expand category and tag data
    note_dict = await expand_note_data(note_dict, db)
    
    # Emit WebSocket event
    await sio.emit('note_updated', note_dict, room=f"user_{current_user.id}")
    
    return note_dict

@router.delete("/{note_id}")
async def delete_note(
    note_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Elimina una nota y escribe entrada en `note_history`. Emite `note_deleted`."""
    collection = get_collection("notes")
    
    try:
        # Check if note exists
        existing_note = await collection.find_one({
            "_id": ObjectId(note_id),
            "user_id": current_user.id
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid note ID")
    
    if existing_note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Delete note
    await collection.delete_one({"_id": ObjectId(note_id)})
    
    # Create history entry
    history_collection = get_collection("note_history")
    history_doc = {
        "note_id": ObjectId(note_id),
        "action": "deleted",
        "changes": existing_note,
        "user_id": current_user.id,
        "timestamp": datetime.utcnow()
    }
    await history_collection.insert_one(history_doc)
    
    # Emit WebSocket event
    await sio.emit('note_deleted', {"id": note_id}, room=f"user_{current_user.id}")
    
    return {"message": "Note deleted successfully"}

@router.get("/{note_id}/history")
async def get_note_history(
    note_id: str,
    current_user: User = Depends(get_current_active_user)
):
    """Retorna el historial de cambios de una nota (más reciente primero)."""
    # Verify note ownership
    collection = get_collection("notes")
    try:
        note = await collection.find_one({
            "_id": ObjectId(note_id),
            "user_id": current_user.id
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid note ID")
    
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Get history
    history_collection = get_collection("note_history")
    cursor = history_collection.find({
        "note_id": ObjectId(note_id)
    }).sort("timestamp", -1)
    
    history = await cursor.to_list(length=None)
    
    # Convert to response format
    history_list = []
    for entry in history:
        history_dict = {
            "id": str(entry["_id"]),
            "note_id": str(entry["note_id"]),
            "action": entry["action"],
            "changes": entry["changes"],
            "user_id": entry["user_id"],
            "timestamp": entry["timestamp"]
        }
        history_list.append(history_dict)
    
    return history_list