import os
from typing import Dict, Any, List, Optional

import httpx

# Base URLs de servicios centrales (con valores por defecto para entorno docker)
TAGS_SERVICE_URL = os.getenv("TAGS_SERVICE_URL", "http://tags-service:8005")
CATEGORIES_SERVICE_URL = os.getenv("CATEGORIES_SERVICE_URL", "http://categories-service:8006")


def expand_category(category_id: Optional[str], user_id: int) -> Dict[str, Any] | None:
    if not category_id:
        return None
    try:
        cid = int(category_id)
    except (ValueError, TypeError):
        return None

    url = f"{CATEGORIES_SERVICE_URL}/internal/categories"
    headers = {"X-User-Id": str(user_id)}
    params = {"ids": str(cid)}
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


def expand_tags(tag_ids: List[str], user_id: int) -> List[Dict[str, Any]]:
    if not tag_ids:
        return []
    valid_ids: List[int] = []
    for tid in tag_ids:
        try:
            valid_ids.append(int(tid))
        except (ValueError, TypeError):
            continue
    if not valid_ids:
        return []

    url = f"{TAGS_SERVICE_URL}/internal/tags"
    headers = {"X-User-Id": str(user_id)}
    params = {"ids": ",".join(str(i) for i in valid_ids)}
    try:
        with httpx.Client(timeout=5.0) as client:
            resp = client.get(url, headers=headers, params=params)
            if resp.status_code != 200:
                return []
            data = resp.json() or []
            return [{"id": str(t.get("id")), "name": t.get("name"), "color": t.get("color")} for t in data]
    except Exception:
        return []