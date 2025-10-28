"""
CRUD de etiquetas (tags) por usuario.

Notas:
- Nombre único por usuario (validado en create/update)
- Los colores personalizados son respetados y enviados al front
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.postgres import get_db
from app.models.postgres_models import Tag, User
from app.schemas.tag_schemas import Tag as TagSchema, TagCreate, TagUpdate
from app.core.security import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[TagSchema])
async def get_tags(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Obtiene todas las etiquetas del usuario actual."""
    tags = db.query(Tag).filter(Tag.user_id == current_user.id).all()
    return tags

@router.post("/", response_model=TagSchema)
async def create_tag(
    tag: TagCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Crea una etiqueta nueva para el usuario actual."""
    # Check if tag name already exists for this user
    existing_tag = db.query(Tag).filter(
        Tag.name == tag.name,
        Tag.user_id == current_user.id
    ).first()
    
    if existing_tag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag with this name already exists"
        )
    
    db_tag = Tag(
        name=tag.name,
        color=tag.color,
        description=tag.description,
        user_id=current_user.id
    )
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag

@router.get("/{tag_id}", response_model=TagSchema)
async def get_tag(
    tag_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Obtiene una etiqueta por ID si pertenece al usuario actual."""
    tag = db.query(Tag).filter(
        Tag.id == tag_id,
        Tag.user_id == current_user.id
    ).first()
    
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    return tag

@router.put("/{tag_id}", response_model=TagSchema)
async def update_tag(
    tag_id: int,
    tag_update: TagUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Actualiza una etiqueta (nombre/color/description)."""
    tag = db.query(Tag).filter(
        Tag.id == tag_id,
        Tag.user_id == current_user.id
    ).first()
    
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Check if new name already exists (if name is being updated)
    if tag_update.name and tag_update.name != tag.name:
        existing_tag = db.query(Tag).filter(
            Tag.name == tag_update.name,
            Tag.user_id == current_user.id
        ).first()
        
        if existing_tag:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Tag with this name already exists"
            )
    
    # Update fields
    if tag_update.name is not None:
        tag.name = tag_update.name
    if tag_update.color is not None:
        tag.color = tag_update.color
    if tag_update.description is not None:
        tag.description = tag_update.description
    
    db.commit()
    db.refresh(tag)
    return tag

@router.delete("/{tag_id}")
async def delete_tag(
    tag_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Elimina una etiqueta del usuario actual."""
    tag = db.query(Tag).filter(
        Tag.id == tag_id,
        Tag.user_id == current_user.id
    ).first()
    
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    db.delete(tag)
    db.commit()
    return {"message": "Tag deleted successfully"}