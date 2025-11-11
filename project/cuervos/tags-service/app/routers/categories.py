from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from .. import crud
from ..schemas import CategoryCreate, CategoryUpdate, CategoryRead, AttachTagRequest

router = APIRouter(prefix="/categories", tags=["categories"])


@router.post("", response_model=CategoryRead, status_code=201)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    cat = crud.create_category(db, payload.name, payload.color, payload.description)
    return cat


@router.get("", response_model=List[CategoryRead])
def list_categories(db: Session = Depends(get_db)):
    cats = crud.get_categories(db)
    return cats


@router.get("/{category_id}", response_model=CategoryRead)
def get_category(category_id: int, db: Session = Depends(get_db)):
    cat = crud.get_category(db, category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat


@router.put("/{category_id}", response_model=CategoryRead)
def update_category(category_id: int, payload: CategoryUpdate, db: Session = Depends(get_db)):
    cat = crud.update_category(db, category_id, payload.name, payload.color, payload.description)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat


@router.delete("/{category_id}", status_code=204)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    ok = crud.delete_category(db, category_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Category not found")


@router.post("/{category_id}/tags")
def attach_tag(category_id: int, payload: AttachTagRequest, db: Session = Depends(get_db)):
    ok = crud.attach_tag_to_category(db, category_id, payload.tag_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Category or Tag not found")
    return {"ok": True}


@router.delete("/{category_id}/tags/{tag_id}", status_code=204)
def detach_tag(category_id: int, tag_id: int, db: Session = Depends(get_db)):
    ok = crud.detach_tag_from_category(db, category_id, tag_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Category or Tag not found")