from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

# Modelos tipo documento para referencia (no ODM). Usamos dicts con Motor.

def note_doc(title: str, content: str, user_id: int, category_id: Optional[str], tag_ids: List[str]) -> Dict[str, Any]:
    now = datetime.utcnow()
    return {
        "title": title,
        "content": content,
        "user_id": user_id,
        "category_id": category_id,
        "tag_ids": tag_ids or [],
        "created_at": now,
        "updated_at": now,
    }


def note_history_doc(note_id: Any, title: str, content: str, user_id: int, category_id: Optional[str], tag_ids: List[str], action: str) -> Dict[str, Any]:
    return {
        "note_id": ObjectId(note_id) if isinstance(note_id, str) else note_id,
        "title": title,
        "content": content,
        "user_id": user_id,
        "category_id": category_id,
        "tag_ids": tag_ids or [],
        "action": action,
        "timestamp": datetime.utcnow(),
    }