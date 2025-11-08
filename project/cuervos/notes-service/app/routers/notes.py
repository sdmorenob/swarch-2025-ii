from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Header
from bson import ObjectId

from app.database.mongodb import get_collection
from app.schemas.note_schemas import Note as NoteSchema, NoteCreate, NoteUpdate, PaginatedResponse
from app.services.expand import expand_category, expand_tags
from app.models.mongodb_models import note_doc, note_history_doc
from app.services.events import publish_event

router = APIRouter(prefix="/notes", tags=["notes"])


def get_current_user_id(x_user_id: Optional[int] = Header(default=None)) -> int:
    return x_user_id or 1

@router.get("/", response_model=PaginatedResponse[NoteSchema])
async def read_notes(page: int = 1, size: int = 20, search: Optional[str] = None, user_id: int = Depends(get_current_user_id)):
    collection = await get_collection("notes")
    query = {"user_id": user_id}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"content": {"$regex": search, "$options": "i"}},
            {"tag_ids": {"$in": [search]}},
        ]
    skip = (page - 1) * size
    total = await collection.count_documents(query)
    cursor = collection.find(query).skip(skip).limit(size).sort("updated_at", -1)
    notes = await cursor.to_list(length=size)

    items = []
    for n in notes:
        note = {
            "id": str(n.get("_id")),
            "title": n.get("title"),
            "content": n.get("content"),
            "category_id": n.get("category_id"),
            "tag_ids": n.get("tag_ids", []),
            "user_id": n.get("user_id"),
            "created_at": n.get("created_at"),
            "updated_at": n.get("updated_at"),
        }
        note["category"] = expand_category(note.get("category_id"), user_id) if note.get("category_id") else None
        note["tags"] = expand_tags(note.get("tag_ids", []), user_id)
        items.append(note)
    pages = (total + size - 1) // size
    return {"items": items, "total": total, "page": page, "size": size, "pages": pages}

@router.post("/", response_model=NoteSchema, status_code=201)
async def create_note(note_in: NoteCreate, user_id: int = Depends(get_current_user_id)):
    collection = await get_collection("notes")
    doc = note_doc(title=note_in.title, content=note_in.content, user_id=user_id, category_id=note_in.category_id, tag_ids=note_in.tag_ids)
    result = await collection.insert_one(doc)
    created = await collection.find_one({"_id": result.inserted_id})
    note = {
        "id": str(created.get("_id")),
        "title": created.get("title"),
        "content": created.get("content"),
        "category_id": created.get("category_id"),
        "tag_ids": created.get("tag_ids", []),
        "user_id": created.get("user_id"),
        "created_at": created.get("created_at"),
        "updated_at": created.get("updated_at"),
    }
    note["category"] = expand_category(note.get("category_id"), user_id) if note.get("category_id") else None
    note["tags"] = expand_tags(note.get("tag_ids", []), user_id)
    # Historial
    history_col = await get_collection("note_history")
    await history_col.insert_one(note_history_doc(note_id=note["id"], title=note["title"], content=note["content"], user_id=user_id, category_id=note.get("category_id"), tag_ids=note.get("tag_ids", []), action="created"))
    publish_event(
        "note.created",
        {
            "entity": "note",
            "event_type": "created",
            "user_id": user_id,
            "id": note["id"],
            "title": note["title"],
            "category_id": note.get("category_id"),
            "tag_ids": note.get("tag_ids", []),
        },
    )
    return note

@router.get("/{note_id}", response_model=NoteSchema)
async def read_note(note_id: str, user_id: int = Depends(get_current_user_id)):
    collection = await get_collection("notes")
    try:
        oid = ObjectId(note_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid note ID")
    n = await collection.find_one({"_id": oid, "user_id": user_id})
    if not n:
        raise HTTPException(status_code=404, detail="Note not found")
    note = {
        "id": str(n.get("_id")),
        "title": n.get("title"),
        "content": n.get("content"),
        "category_id": n.get("category_id"),
        "tag_ids": n.get("tag_ids", []),
        "user_id": n.get("user_id"),
        "created_at": n.get("created_at"),
        "updated_at": n.get("updated_at"),
    }
    note["category"] = expand_category(note.get("category_id"), user_id) if note.get("category_id") else None
    note["tags"] = expand_tags(note.get("tag_ids", []), user_id)
    return note

@router.put("/{note_id}", response_model=NoteSchema)
async def update_note(note_id: str, patch: NoteUpdate, user_id: int = Depends(get_current_user_id)):
    collection = await get_collection("notes")
    try:
        oid = ObjectId(note_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid note ID")
    n = await collection.find_one({"_id": oid, "user_id": user_id})
    if not n:
        raise HTTPException(status_code=404, detail="Note not found")
    update = {}
    if patch.title is not None:
        update["title"] = patch.title
    if patch.content is not None:
        update["content"] = patch.content
    if patch.category_id is not None:
        update["category_id"] = patch.category_id
    if patch.tag_ids is not None:
        update["tag_ids"] = patch.tag_ids
    if update:
        update["updated_at"] = n.get("updated_at")  # keep last or set now
    await collection.update_one({"_id": oid}, {"$set": update})
    n2 = await collection.find_one({"_id": oid})
    note = {
        "id": str(n2.get("_id")),
        "title": n2.get("title"),
        "content": n2.get("content"),
        "category_id": n2.get("category_id"),
        "tag_ids": n2.get("tag_ids", []),
        "user_id": n2.get("user_id"),
        "created_at": n2.get("created_at"),
        "updated_at": n2.get("updated_at"),
    }
    note["category"] = expand_category(note.get("category_id"), user_id) if note.get("category_id") else None
    note["tags"] = expand_tags(note.get("tag_ids", []), user_id)
    # Historial
    history_col = await get_collection("note_history")
    await history_col.insert_one(note_history_doc(note_id=note["id"], title=note["title"], content=note["content"], user_id=user_id, category_id=note.get("category_id"), tag_ids=note.get("tag_ids", []), action="updated"))
    publish_event(
        "note.updated",
        {
            "entity": "note",
            "event_type": "updated",
            "user_id": user_id,
            "id": note["id"],
            "title": note["title"],
            "category_id": note.get("category_id"),
            "tag_ids": note.get("tag_ids", []),
        },
    )
    return note

@router.delete("/{note_id}", status_code=204)
async def delete_note(note_id: str, user_id: int = Depends(get_current_user_id)):
    collection = await get_collection("notes")
    try:
        oid = ObjectId(note_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid note ID")
    n = await collection.find_one({"_id": oid, "user_id": user_id})
    if not n:
        raise HTTPException(status_code=404, detail="Note not found")
    await collection.delete_one({"_id": oid})
    history_col = await get_collection("note_history")
    await history_col.insert_one(note_history_doc(note_id=str(oid), title=n.get("title"), content=n.get("content"), user_id=user_id, category_id=n.get("category_id"), tag_ids=n.get("tag_ids", []), action="deleted"))
    publish_event(
        "note.deleted",
        {
            "entity": "note",
            "event_type": "deleted",
            "user_id": user_id,
            "id": str(oid),
            "title": n.get("title"),
        },
    )
    return None