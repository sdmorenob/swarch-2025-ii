from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import schemas, models, crud
from ..auth import get_db, get_current_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return schemas.UserOut.from_orm(current_user)


@router.get("/{user_id}", response_model=schemas.UserPublic)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=404, detail="User not found")
    return schemas.UserPublic.from_orm(user)

@router.put("/me", response_model=schemas.UserOut)
def update_me(
    user_in: schemas.UserUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    updated = crud.update_user(db, current_user.user_id, user_in)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return schemas.UserOut.from_orm(updated)