from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session
from typing import Annotated

from app.api.deps import SessionDep
from app.core import security
from app.core.config import settings
from app.db.crud import UserCRUD
from app.models.models import User
from app.schemas.token import Token


router = APIRouter(tags=["login"])


def authenticate(session: Session, email: str, password: str) -> User | None:
    user = UserCRUD(session).get_user_by_email(email=email)
    if not user:
        return None
    if not security.verify_password(password, user.password):
        return None
    return user


@router.post("/login/token")
def login_access_token(session: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = authenticate(session=session, email=form_data.username, 
                        password=form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, 
                            detail="Incorrect username or password")
    elif not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, 
                            detail="Inactive user")
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=security.create_access_token(user.id, 
                                                  expires_delta=access_token_expires), 
        token_type="bearer")
