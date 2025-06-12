from datetime import datetime, timezone
from pydantic import BaseModel, Field, EmailStr, SecretStr
import uuid


class UserBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr = Field(max_length=255)
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)
    creation_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserCreate(UserBase):
    password: SecretStr = Field(min_length=8, max_length=40)
    

class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(BaseModel):
    data: list[UserPublic]
    count: int


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)
    password: SecretStr | None = Field(default=None, min_length=8, max_length=40)
    is_active: bool | None = Field(default=None)
    is_superuser: bool | None = Field(default=None)


class UserRegister(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr = Field(max_length=255)
    password: SecretStr = Field(min_length=8, max_length=40)
    is_active: bool = False


class UserUpdateMe(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)
    is_active: bool = True


class UpdatePassword(BaseModel):
    current_password: SecretStr = Field(min_length=8, max_length=40)
    new_password: SecretStr = Field(min_length=8, max_length=40)


class PasswordReset(BaseModel):
    token: str
    new_password: SecretStr = Field(min_length=8, max_length=40)
