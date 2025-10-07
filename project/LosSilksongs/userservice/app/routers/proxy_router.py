# app/routers/proxy_router.py
from fastapi import APIRouter, Depends, HTTPException
import requests
from ..config import settings

router = APIRouter(prefix="/proxy", tags=["proxy"])

@router.get("/users/{user_id}/playlists")
def get_user_playlists(user_id: int):
    # Proxy request to musicservice to fetch playlists for a user
    try:
        r = requests.get(f"{settings.MUSICSERVICE_URL}/api/v1/users/{user_id}/playlists", timeout=5)
        r.raise_for_status()
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail="Failed to contact musicservice")
    return r.json()
