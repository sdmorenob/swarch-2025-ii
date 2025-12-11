from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
from .models import Tag

# Tags (scoped by user_id)

def create_tag(db: Session, user_id: int, name: str, color: Optional[str], description: Optional[str]) -> Tag:
    tag = Tag(user_id=user_id, name=name, color=color, description=description)
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


def get_tags(db: Session, user_id: int, ids: Optional[List[int]] = None) -> List[Tag]:
    stmt = select(Tag).where(Tag.user_id == user_id)
    if ids:
        stmt = stmt.where(Tag.id.in_(ids))
    return db.execute(stmt).scalars().all()


def update_tag(db: Session, user_id: int, tag_id: int, name: Optional[str], color: Optional[str], description: Optional[str]) -> Optional[Tag]:
    tag = db.get(Tag, tag_id)
    if not tag or tag.user_id != user_id:
        return None
    if name is not None:
        tag.name = name
    if color is not None:
        tag.color = color
    if description is not None:
        tag.description = description
    db.commit()
    db.refresh(tag)
    return tag


def delete_tag(db: Session, user_id: int, tag_id: int) -> bool:
    tag = db.get(Tag, tag_id)
    if not tag or tag.user_id != user_id:
        return False
    db.delete(tag)
    db.commit()
    return True