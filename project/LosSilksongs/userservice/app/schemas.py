from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: EmailStr
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=100)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)
    profile_picture_url: str = ""
    bio: str = ""


class UserOut(UserBase):
    user_id: int
    profile_picture_url: str
    bio: str
    is_active: bool

    class Config:
        orm_mode = True

class UserPublic(BaseModel):
    user_id: int
    username: str
    first_name: str
    last_name: str
    profile_picture_url: str
    bio: str

    class Config:
        orm_mode = True

class UserUpdate(BaseModel):
    username: str | None = None
    email: EmailStr | None = None
    first_name: str | None = None
    last_name: str | None = None
    profile_picture_url: str | None = None
    bio: str | None = None

    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    email: Optional[str] = None