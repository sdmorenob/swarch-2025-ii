from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .. import crud, schemas, models, auth
from ..auth import get_db, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=schemas.UserOut)
def register(
    email: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    first_name: str = Form(...), 
    last_name: str = Form(...),
    db: Session = Depends(get_db)
):
    # Construir el objeto UserCreate
    user_in = schemas.UserCreate(        
        email=email, 
        username=username, 
        password=password,
        first_name=first_name, 
        last_name=last_name   
        )
    
    # Validar que el email no esté registrado
    if crud.get_user_by_email(db, user_in.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validar que el username no esté tomado
    if crud.get_user_by_username(db, user_in.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Crear el usuario
    user = crud.create_user(db, user_in)
    return schemas.UserOut.from_orm(user)


@router.post("/token", response_model=schemas.Token)
def login_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}