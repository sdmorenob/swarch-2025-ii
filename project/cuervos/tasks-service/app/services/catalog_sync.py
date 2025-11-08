import os
from typing import List, Set

import httpx
from sqlalchemy.orm import Session

from app.models.postgres_models import Category, Tag

TAGS_SERVICE_URL = os.getenv("TAGS_SERVICE_URL", "http://tags-service:8005")
CATEGORIES_SERVICE_URL = os.getenv("CATEGORIES_SERVICE_URL", "http://categories-service:8006")


def ensure_category(db: Session, category_id: int, user_id: int) -> bool:
    """Ensure a Category row exists locally for given id. Returns True if ensured/existing."""
    existing = db.query(Category).filter(Category.id == category_id).first()
    if existing:
        return True
    headers = {"X-User-Id": str(user_id)}
    params = {"ids": str(category_id)}
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(f"{CATEGORIES_SERVICE_URL}/internal/categories", headers=headers, params=params)
            if resp.status_code != 200:
                return False
            data = resp.json() or []
            if not data:
                return False
            cat = data[0]
            # Create local stub
            db.add(Category(id=int(cat.get("id")), name=cat.get("name") or "", color=cat.get("color") or "#1976d2", user_id=user_id))
            db.flush()
            return True
    except Exception:
        return False


def ensure_tags(db: Session, tag_ids: List[int], user_id: int) -> None:
    """Ensure Tag rows exist locally for given ids. Creates missing ones from Tags Service."""
    if not tag_ids:
        return
    existing_ids: Set[int] = set(x for x, in db.query(Tag.id).filter(Tag.id.in_(tag_ids)).all())
    missing = [tid for tid in tag_ids if tid not in existing_ids]
    if not missing:
        return
    headers = {"X-User-Id": str(user_id)}
    params = {"ids": ",".join(str(i) for i in missing)}
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(f"{TAGS_SERVICE_URL}/internal/tags", headers=headers, params=params)
            if resp.status_code != 200:
                return
            data = resp.json() or []
            for t in data:
                try:
                    db.add(Tag(id=int(t.get("id")), name=t.get("name") or "", color=t.get("color") or "#1976d2", user_id=user_id))
                except Exception:
                    continue
            db.flush()
    except Exception:
        return