import os
from typing import List, Dict, Any

import httpx

from app.models.postgres_models import Task
from app.schemas.task_schemas import TagSummary, CategorySummary

# Base URLs de servicios centrales (con valores por defecto para entorno docker)
TAGS_SERVICE_URL = os.getenv("TAGS_SERVICE_URL", "http://tags-service:8005")
CATEGORIES_SERVICE_URL = os.getenv("CATEGORIES_SERVICE_URL", "http://categories-service:8006")


def expand_category(category_id: int | None, user_id: int) -> Dict[str, Any] | None:
    if not category_id:
        return None
    url = f"{CATEGORIES_SERVICE_URL}/internal/categories"
    headers = {"X-User-Id": str(user_id)}
    params = {"ids": str(category_id)}
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(url, headers=headers, params=params)
            if resp.status_code != 200:
                return None
            data = resp.json() or []
            if not data:
                return None
            cat = data[0]
            return {"id": str(cat.get("id")), "name": cat.get("name"), "color": cat.get("color")}
    except Exception:
        return None


def expand_tags(tag_ids: List[int], user_id: int) -> List[Dict[str, Any]]:
    if not tag_ids:
        return []
    url = f"{TAGS_SERVICE_URL}/internal/tags"
    headers = {"X-User-Id": str(user_id)}
    params = {"ids": ",".join(str(i) for i in tag_ids)}
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(url, headers=headers, params=params)
            if resp.status_code != 200:
                return []
            data = resp.json() or []
            return [{"id": str(t.get("id")), "name": t.get("name"), "color": t.get("color")} for t in data]
    except Exception:
        return []


def serialize_task(task: Task, user_id: int) -> dict:
    task_dict = {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "completed": task.completed,
        "priority": task.priority,
        "due_date": task.due_date,
        "user_id": task.user_id,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "status": "completed" if task.completed else "in_progress",
    }
    # Category expansion via Categories Service
    task_dict["category"] = expand_category(task.category_id, user_id) if task.category_id else None

    # Tags expansion via Tags Service (usando task.tag_ids)
    tag_ids = task.tag_ids or []
    tag_summaries = [TagSummary(id=str(ts["id"]), name=ts["name"], color=ts.get("color")).model_dump() for ts in expand_tags(tag_ids, user_id)]
    task_dict["tags"] = tag_summaries

    return task_dict