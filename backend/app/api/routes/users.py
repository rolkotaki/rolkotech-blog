from fastapi import APIRouter, Depends, HTTPException, status
import uuid

from app.api.deps import SessionDep, CurrentUser, get_current_active_superuser
from app.core.security import get_password_hash, verify_password
from app.db.crud import UserCRUD
from app.models.models import User
from app.schemas.message import Message
from app.schemas.user import (UserPublic, UsersPublic, UserCreate, UserUpdate, 
                              UserUpdateMe, UpdatePassword, UserRegister)


router = APIRouter(prefix="/users", tags=["users"])


@router.get("/",
           dependencies=[Depends(get_current_active_superuser)],
           response_model=UsersPublic)
def read_users(session: SessionDep, skip: int = 0, limit: int = 100) -> UsersPublic:
    """
    Retrieve users.
    """
    count, users = UserCRUD(session).read_users(skip=skip, limit=limit)
    # Convert User models to UserPublic models
    users = [UserPublic.model_validate(user, from_attributes=True) for user in users]
    return UsersPublic(data=users, count=count)


@router.get("/me", response_model=UserPublic)
def read_user_me(current_user: CurrentUser) -> UserPublic:
    """
    Get current user.
    """
    return current_user


@router.get("/{user_id}", response_model=UserPublic)
def read_user_by_id(user_id: uuid.UUID, session: SessionDep, current_user: CurrentUser) -> UserPublic:
    """
    Get user by ID.
    """
    user = session.get(User, user_id)
    if user == current_user:
        return user
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges",
        )
    return user


@router.post("/signup", response_model=UserPublic)
def register_user(session: SessionDep, user_in: UserRegister) -> UserPublic:
    """
    Create a new user by user signup.
    """
    user_crud = UserCRUD(session)
    user = user_crud.get_user_by_email(email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists",
        )
    user = user_crud.get_user_by_name(username=user_in.name)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this name already exists",
        )
    user_create = UserRegister.model_validate(user_in)
    user = user_crud.create_user(user=user_create)
    return user


@router.post("/",
             dependencies=[Depends(get_current_active_superuser)],
             response_model=UserPublic)
def create_user(session: SessionDep, user_in: UserCreate) -> UserPublic:
    """
    Create new user (with admin privileges).
    """
    user_crud = UserCRUD(session)
    user = user_crud.get_user_by_email(email=user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists",
        )
    user = user_crud.get_user_by_name(username=user_in.name)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this name already exists",
        )
    user = user_crud.create_user(user=user_in)
    return user


@router.patch("/me", response_model=UserPublic)
def update_user_me(session: SessionDep, user_in: UserUpdateMe, current_user: CurrentUser) -> UserPublic:
    """
    Update own user.
    """
    user_crud = UserCRUD(session)
    if user_in.email:
        existing_user = user_crud.get_user_by_email(email=user_in.email)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="User with this email already exists"
            )
    if user_in.name:
        existing_user = user_crud.get_user_by_name(username=user_in.name)
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="User with this name already exists"
            )
    current_user = user_crud.update_user(user_db=current_user, user_in=user_in)
    return current_user


@router.patch("/{user_id}",
              dependencies=[Depends(get_current_active_superuser)],
              response_model=UserPublic)
def update_user(session: SessionDep, user_id: uuid.UUID, user_in: UserUpdate, current_user: CurrentUser) -> UserPublic:
    """
    Update a user (with admin privileges).
    """
    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    user_crud = UserCRUD(session)
    if user_in.email:
        existing_user = user_crud.get_user_by_email(email=user_in.email)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="User with this email already exists"
            )
    if user_in.name:
        existing_user = user_crud.get_user_by_name(username=user_in.name)
        if existing_user and existing_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="User with this name already exists"
            )
    if user_in.is_superuser is not None and not user_in.is_superuser and db_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super users cannot demote themselves"
        )
    db_user = user_crud.update_user(user_db=db_user, user_in=user_in)
    return db_user


@router.patch("/me/password", response_model=Message)
def update_password_me(session: SessionDep, body: UpdatePassword, current_user: CurrentUser) -> Message:
    """
    Update own password.
    """
    if not verify_password(body.current_password.get_secret_value(), current_user.password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect password")
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="New password cannot be the same as the current one"
        )
    current_user.password = get_password_hash(body.new_password.get_secret_value())
    session.add(current_user)
    session.commit()
    return Message(message="Password updated successfully")


@router.delete("/me", response_model=Message)
def delete_user_me(session: SessionDep, current_user: CurrentUser) -> Message:
    """
    Delete own user.
    """
    if current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Super users are not allowed to delete themselves"
        )
    user_crud = UserCRUD(session)
    user_crud.delete_user(user_db=current_user)
    return Message(message="User deleted successfully")


@router.delete("/{user_id}", 
               dependencies=[Depends(get_current_active_superuser)],
               response_model=Message)
def delete_user(session: SessionDep, current_user: CurrentUser, user_id: uuid.UUID) -> Message:
    """
    Delete a user (with admin privileges).
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user == current_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Super users are not allowed to delete themselves"
        )
    user_crud = UserCRUD(session)
    user_crud.delete_user(user_db=user)
    return Message(message="User deleted successfully")
