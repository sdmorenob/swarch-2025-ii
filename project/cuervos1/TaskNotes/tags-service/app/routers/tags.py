from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session
from ..db import get_db
from .. import crud
from ..schemas import TagCreate, TagUpdate, TagRead
from ..services.events import publish_event

router = APIRouter(prefix="/tags", tags=["tags"])
internal_router = APIRouter(prefix="/internal", tags=["internal-tags"])


@router.post("", response_model=TagRead, status_code=201)
def create_tag(
    payload: TagCreate,
    db: Session = Depends(get_db),
    x_user_id: int = Header(alias="X-User-Id")
):
    # Duplicate check by name per user
    existing = crud.get_tags(db, user_id=x_user_id)
    if any(t.name.lower() == payload.name.lower() for t in existing):
        raise HTTPException(status_code=409, detail="Tag name already exists for user")
    tag = crud.create_tag(db, x_user_id, payload.name, payload.color, payload.description)
    publish_event(
        "tag.created",
        {
            "entity": "tag",
            "event_type": "created",
            "user_id": x_user_id,
            "id": tag.id,
            "name": tag.name,
            "color": tag.color,
        },
    )
    return tag


@router.get("", response_model=List[TagRead])
def list_tags(
    ids: Optional[str] = Query(default=None, description="comma-separated IDs"),
    db: Session = Depends(get_db),
    x_user_id: int = Header(alias="X-User-Id")
):
    id_list: Optional[List[int]] = None
    if ids:
        try:
            id_list = [int(x) for x in ids.split(",") if x.strip()]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid id in ids query param")
    tags = crud.get_tags(db, user_id=x_user_id, ids=id_list)
    return tags


@router.put("/{tag_id}", response_model=TagRead)
def update_tag(
    tag_id: int,
    payload: TagUpdate,
    db: Session = Depends(get_db),
    x_user_id: int = Header(alias="X-User-Id")
):
    # If updating name, ensure uniqueness for this user
    if payload.name is not None:
        existing = crud.get_tags(db, user_id=x_user_id)
        if any(t.id != tag_id and t.name.lower() == payload.name.lower() for t in existing):
            raise HTTPException(status_code=409, detail="Tag name already exists for user")
    tag = crud.update_tag(db, x_user_id, tag_id, payload.name, payload.color, payload.description)
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    publish_event(
        "tag.updated",
        {
            "entity": "tag",
            "event_type": "updated",
            "user_id": x_user_id,
            "id": tag.id,
            "name": tag.name,
            "color": tag.color,
        },
    )
    return tag


@router.delete("/{tag_id}", status_code=204)
def delete_tag(tag_id: int, db: Session = Depends(get_db), x_user_id: int = Header(alias="X-User-Id")):
    ok = crud.delete_tag(db, x_user_id, tag_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Tag not found")
    publish_event(
        "tag.deleted",
        {
            "entity": "tag",
            "event_type": "deleted",
            "user_id": x_user_id,
            "id": tag_id,
        },
    )
    

# Internal endpoint to resolve tags by ids (also scoped by user)
@internal_router.get("/tags", response_model=List[TagRead])
def internal_list_tags(
    ids: Optional[str] = Query(default=None, description="comma-separated IDs"),
    db: Session = Depends(get_db),
    x_user_id: int = Header(alias="X-User-Id")
):
    return list_tags(ids=ids, db=db, x_user_id=x_user_id)