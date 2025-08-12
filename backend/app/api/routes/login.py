from datetime import timedelta
from fastapi import APIRouter, Depends, Request, HTTPException, status, BackgroundTasks
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session
from typing import Annotated

from app.api.deps import SessionDep
from app.core.config import settings
from app.core.security import (
    verify_password,
    create_access_token,
    get_password_hash,
    generate_token,
    verify_token,
)
from app.db.crud import UserCRUD
from app.logger import logger
from app.models.models import User
from app.rolkotech_email.EmailGenerator import EMAIL_GENERATOR
from app.schemas.message import Message
from app.schemas.token import Token
from app.schemas.user import PasswordReset


router = APIRouter(tags=["login"])


def authenticate(session: Session, email: str, password: str) -> User | None:
    """
    Authenticate a user by email and password.
    Returns the user if authentication is successful, otherwise None.
    """
    user = UserCRUD(session).get_user_by_email(email=email)
    if not user:
        return None
    if not verify_password(password, user.password):
        return None
    return user


@router.post("/login/access-token")
def login_access_token(
    session: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = authenticate(
        session=session, email=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect username or password",
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user"
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=create_access_token(user.id, expires_delta=access_token_expires),
        token_type="bearer",
    )


@router.get("/users/activate")
def activate_user(session: SessionDep, token: str) -> RedirectResponse:
    """
    Activate a user's account using the activation token.
    Redirect to frontend login page with success/error message.
    """
    try:
        user_email = verify_token(token)
        user = UserCRUD(session).get_user_by_email(email=user_email)
        if not user:
            logger.info(
                f"Activation attempted with invalid token for email: {user_email}"
            )
            return RedirectResponse(
                url=f"{settings.FRONTEND_HOST}/login?error=invalid_link",
                status_code=status.HTTP_302_FOUND,
            )

        if user.is_active:
            return RedirectResponse(
                url=f"{settings.FRONTEND_HOST}/login?message=already_activated",
                status_code=status.HTTP_302_FOUND,
            )

        user.is_active = True
        session.add(user)
        session.commit()
        logger.info(f"User {user.name} ({user.email}) has activated their account.")

        return RedirectResponse(
            url=f"{settings.FRONTEND_HOST}/login?message=activation_success",
            status_code=status.HTTP_302_FOUND,
        )

    except Exception as e:
        logger.error(f"Error during account activation: {str(e)}")
        return RedirectResponse(
            url=f"{settings.FRONTEND_HOST}/login?error=activation_failed",
            status_code=status.HTTP_302_FOUND,
        )


@router.post("/users/forgot-password", response_model=Message)
def forgot_password(
    request: Request, session: SessionDep, email: str, background_tasks: BackgroundTasks
):
    """
    Send password reset email if a user exists with the given email.
    """
    message = "If the email exists and is active, a reset link has been sent."
    user = UserCRUD(session).get_user_by_email(email=email)
    if not user or not user.is_active:
        return Message(message=message)

    # Generate a token and send the reset link
    token = generate_token(user.email)
    reset_link = f"{settings.FRONTEND_HOST}/reset-password?token={token}"
    reset_email = EMAIL_GENERATOR.create_password_reset_email(
        email=user.email, username=user.name, reset_link=reset_link
    )
    background_tasks.add_task(reset_email.send)

    return Message(message=message)


@router.post("/users/reset-password", response_model=Message)
def reset_password(session: SessionDep, data: PasswordReset):
    """
    Reset the user's password using the provided token.
    """
    user_email = verify_token(data.token)
    user = UserCRUD(session).get_user_by_email(email=user_email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired token."
        )
    user.password = get_password_hash(data.new_password.get_secret_value())
    session.add(user)
    session.commit()
    return Message(message="Password has been reset successfully.")
