from fastapi.testclient import TestClient
import pytest
from sqlmodel import Session, delete
from unittest.mock import patch

from app.core.config import settings
from app.core.security import generate_token
from app.db.crud import UserCRUD
from app.models.models import User
from app.rolkotech_email.RolkoTechEmail import RolkoTechEmail
from app.schemas.user import UserCreate, UserUpdate


@pytest.fixture(scope="function")
def setup_user(db: Session) -> tuple[str, str]:
    email = "user1@email.com"
    password = "password"
    user_crud = UserCRUD(db)
    if not user_crud.get_user_by_email(email=email):
        user_crud.create_user(
            user=UserCreate(name="user1", email=email, password=password)
        )
    return email, password


@pytest.fixture(scope="function", autouse=True)
def delete_data(db: Session) -> None:
    db.exec(
        delete(User).where(
            (User.email != settings.FIRST_SUPERUSER_EMAIL)
            & (User.email != settings.TEST_USER_EMAIL)
        )
    )
    db.commit()


def test_01_get_access_token_superuser(client: TestClient) -> None:
    login_data = {
        "username": settings.FIRST_SUPERUSER_EMAIL,
        "password": settings.FIRST_SUPERUSER_PASSWORD,
    }
    response = client.post(
        f"{settings.API_VERSION_STR}/login/access-token", data=login_data
    )
    tokens = response.json()
    assert response.status_code == 200
    assert tokens["token_type"] == "bearer"
    assert tokens["access_token"]


def test_02_login_invalid_superuser(client: TestClient) -> None:
    login_data = {
        "username": "noexist",
        "password": settings.FIRST_SUPERUSER_PASSWORD,
    }
    response = client.post(
        f"{settings.API_VERSION_STR}/login/access-token", data=login_data
    )
    tokens = response.json()
    assert response.status_code == 400
    assert tokens["detail"] == "Incorrect username or password"


def test_03_login_invalid_superuser_password(client: TestClient) -> None:
    login_data = {
        "username": settings.FIRST_SUPERUSER_EMAIL,
        "password": settings.FIRST_SUPERUSER_PASSWORD + "invalid",
    }
    response = client.post(
        f"{settings.API_VERSION_STR}/login/access-token", data=login_data
    )
    tokens = response.json()
    assert response.status_code == 400
    assert tokens["detail"] == "Incorrect username or password"


def test_04_login_inactive_superuser(client: TestClient, db: Session) -> None:
    user_crud = UserCRUD(db)
    user = user_crud.get_user_by_email(email=settings.FIRST_SUPERUSER_EMAIL)

    login_data = {
        "username": settings.FIRST_SUPERUSER_EMAIL,
        "password": settings.FIRST_SUPERUSER_PASSWORD,
    }
    response = client.post(
        f"{settings.API_VERSION_STR}/login/access-token", data=login_data
    )
    tokens = response.json()
    assert response.status_code == 200
    assert tokens["token_type"] == "bearer"
    assert tokens["access_token"]
    # Deactivate user
    user_update = UserUpdate(is_active=False)
    user = user_crud.update_user(user_db=user, user_in=user_update)
    # Try to log in again
    response = client.post(
        f"{settings.API_VERSION_STR}/login/access-token", data=login_data
    )
    tokens = response.json()
    assert response.status_code == 400
    assert tokens["detail"] == "Inactive user"
    # Reactivate user
    user_update = UserUpdate(is_active=True)
    user = user_crud.update_user(user_db=user, user_in=user_update)


def test_05_get_access_token_user(
    client: TestClient, setup_user: tuple[str, str]
) -> None:
    username, password = setup_user
    login_data = {
        "username": username,
        "password": password,
    }
    response = client.post(
        f"{settings.API_VERSION_STR}/login/access-token", data=login_data
    )
    tokens = response.json()
    assert response.status_code == 200
    assert tokens["token_type"] == "bearer"
    assert tokens["access_token"]


def test_06_login_invalid_user(client: TestClient, setup_user: tuple[str, str]) -> None:
    username, password = setup_user
    login_data = {
        "username": username + "noexist",
        "password": password,
    }
    response = client.post(
        f"{settings.API_VERSION_STR}/login/access-token", data=login_data
    )
    tokens = response.json()
    assert response.status_code == 400
    assert tokens["detail"] == "Incorrect username or password"


def test_07_login_invalidpassword(
    client: TestClient, setup_user: tuple[str, str]
) -> None:
    username, password = setup_user
    login_data = {
        "username": username,
        "password": password + "invalid",
    }
    response = client.post(
        f"{settings.API_VERSION_STR}/login/access-token", data=login_data
    )
    tokens = response.json()
    assert response.status_code == 400
    assert tokens["detail"] == "Incorrect username or password"


def test_08_login_inactive_user(
    client: TestClient, db: Session, setup_user: tuple[str, str]
) -> None:
    username, password = setup_user
    user_crud = UserCRUD(db)
    user = user_crud.get_user_by_email(email=username)

    login_data = {
        "username": username,
        "password": password,
    }
    response = client.post(
        f"{settings.API_VERSION_STR}/login/access-token", data=login_data
    )
    tokens = response.json()
    assert response.status_code == 200
    assert tokens["token_type"] == "bearer"
    assert tokens["access_token"]
    # Deactivate user
    user_update = UserUpdate(is_active=False)
    user = user_crud.update_user(user_db=user, user_in=user_update)
    # Try to log in again
    response = client.post(
        f"{settings.API_VERSION_STR}/login/access-token", data=login_data
    )
    tokens = response.json()
    assert response.status_code == 400
    assert tokens["detail"] == "Inactive user"
    # Reactivate user
    user_update = UserUpdate(is_active=True)
    user = user_crud.update_user(user_db=user, user_in=user_update)


def test_09_activate_user(
    client: TestClient, db: Session, setup_user: tuple[str, str]
) -> None:
    # Deactivate the user
    email, _ = setup_user
    user_db = UserCRUD(db).get_user_by_email(email=email)
    user_db.is_active = False
    db.add(user_db)
    db.commit()
    db.refresh(user_db)
    assert user_db.is_active is False

    # Generate activation token
    activation_token = generate_token(email)

    # Activate the user
    response = client.get(
        f"{settings.API_VERSION_STR}/users/activate?token={activation_token}"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Account activated successfully."
    db.refresh(user_db)
    assert user_db.is_active is True


def test_10_activate_user_already_active(
    client: TestClient, setup_user: tuple[str, str]
) -> None:
    email, _ = setup_user
    activation_token = generate_token(email)
    response = client.get(
        f"{settings.API_VERSION_STR}/users/activate?token={activation_token}"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Account already activated."


def test_11_activate_user_invalid_link(client: TestClient) -> None:
    activation_token = "invalid_token"
    response = client.get(
        f"{settings.API_VERSION_STR}/users/activate?token={activation_token}"
    )
    data = response.json()
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Invalid activation link."


def test_12_forgot_password(client: TestClient, setup_user: tuple[str, str]) -> None:
    email, _ = setup_user
    with patch.object(RolkoTechEmail, "send", return_value=None) as mock_send:
        response = client.post(
            f"{settings.API_VERSION_STR}/users/forgot-password?email={email}"
        )
        mock_send.assert_called_once()
    message = response.json()
    assert response.status_code == 200
    assert (
        message["message"]
        == "If the email exists and is active, a reset link has been sent."
    )


def test_13_forgot_password_inactive_user(
    client: TestClient, db: Session, setup_user: tuple[str, str]
) -> None:
    email, _ = setup_user
    user_db = UserCRUD(db).get_user_by_email(email=email)
    user_db.is_active = False
    db.add(user_db)
    db.commit()
    db.refresh(user_db)
    assert user_db.is_active is False

    with patch.object(RolkoTechEmail, "send", return_value=None) as mock_send:
        response = client.post(
            f"{settings.API_VERSION_STR}/users/forgot-password?email=invalid_email"
        )
        mock_send.assert_not_called()
    message = response.json()
    assert response.status_code == 200
    assert (
        message["message"]
        == "If the email exists and is active, a reset link has been sent."
    )


def test_14_forgot_password_invalid_email(client: TestClient) -> None:
    with patch.object(RolkoTechEmail, "send", return_value=None) as mock_send:
        response = client.post(
            f"{settings.API_VERSION_STR}/users/forgot-password?email=invalid_email"
        )
        mock_send.assert_not_called()
    message = response.json()
    assert response.status_code == 200
    assert (
        message["message"]
        == "If the email exists and is active, a reset link has been sent."
    )


def test_15_password_reset(client: TestClient, setup_user: tuple[str, str]) -> None:
    email, _ = setup_user
    # Generate a token for the user
    token = generate_token(email)

    # Reset the password using the token
    new_password = "new_password"
    response = client.post(
        f"{settings.API_VERSION_STR}/users/reset-password",
        json={"token": token, "new_password": new_password},
    )
    assert response.status_code == 200
    assert response.json() == {"message": "Password has been reset successfully."}

    # Verify that the new password works
    login_data = {
        "username": email,
        "password": new_password,
    }
    response = client.post(
        f"{settings.API_VERSION_STR}/login/access-token", data=login_data
    )
    tokens = response.json()

    assert response.status_code == 200
    assert tokens["token_type"] == "bearer"
    assert tokens["access_token"]


def test_16_password_reset_invalid_token(client: TestClient) -> None:
    response = client.post(
        f"{settings.API_VERSION_STR}/users/reset-password",
        json={"token": "invalid_token", "new_password": "new_password"},
    )
    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid or expired token."}


def test_17_password_reset_no_token(client: TestClient) -> None:
    response = client.post(
        f"{settings.API_VERSION_STR}/users/reset-password",
        json={"new_password": "new_password"},
    )
    assert response.status_code == 422
    data = response.json()
    assert "message" in data
    assert data["message"] == "Token: Field required"


def test_18_password_reset_no_new_password(client: TestClient) -> None:
    token = generate_token("token")
    response = client.post(
        f"{settings.API_VERSION_STR}/users/reset-password", json={"token": token}
    )
    assert response.status_code == 422
    data = response.json()
    assert "message" in data
    assert data["message"] == "New_Password: Field required"


def test_19_password_reset_invalid_new_password(
    client: TestClient, setup_user: tuple[str, str]
) -> None:
    email, _ = setup_user
    # Generate a token for the user
    token = generate_token(email)

    # Attempt to reset the password with an invalid new password (too short)
    new_password = "short"
    response = client.post(
        f"{settings.API_VERSION_STR}/users/reset-password",
        json={"token": token, "new_password": new_password},
    )

    assert response.status_code == 422
    data = response.json()
    assert "message" in data
    assert (
        data["message"]
        == "New_Password: Value should have at least 8 items after validation, not 5"
    )
