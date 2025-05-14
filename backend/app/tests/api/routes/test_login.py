from fastapi.testclient import TestClient
import pytest
from sqlmodel import Session

from app.core.config import settings
from app.db.crud import UserCRUD
from app.schemas.user import UserCreate, UserUpdate


@pytest.fixture(scope="function")
def setup_user(db: Session) -> tuple[str, str]:
    email = "user1@email.com"
    password = "password"
    user_crud = UserCRUD(db)
    if not user_crud.get_user_by_email(email=email):
        user_crud.create_user(user=UserCreate(name="user1",
                                              email=email, 
                                              password=password))
    return email, password


def test_01_get_access_token_superuser(client: TestClient) -> None:
    login_data = {
        "username": settings.FIRST_SUPERUSER_EMAIL,
        "password": settings.FIRST_SUPERUSER_PASSWORD,
    }
    response = client.post(f"{settings.API_VERSION_STR}/login/access-token", data=login_data)
    tokens = response.json()
    assert response.status_code == 200
    assert tokens["token_type"] == "bearer"
    assert tokens["access_token"]


def test_02_login_invalid_superuser(client: TestClient) -> None:
    login_data = {
        "username": "noexist",
        "password": settings.FIRST_SUPERUSER_PASSWORD,
    }
    response = client.post(f"{settings.API_VERSION_STR}/login/access-token", data=login_data)
    tokens = response.json()
    assert response.status_code == 400
    assert tokens["detail"] == "Incorrect username or password"


def test_03_login_invalid_superuser_password(client: TestClient) -> None:
    login_data = {
        "username": settings.FIRST_SUPERUSER_EMAIL,
        "password": settings.FIRST_SUPERUSER_PASSWORD + "invalid",
    }
    response = client.post(f"{settings.API_VERSION_STR}/login/access-token", data=login_data)
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
    response = client.post(f"{settings.API_VERSION_STR}/login/access-token", data=login_data)
    tokens = response.json()
    assert response.status_code == 200
    assert tokens["token_type"] == "bearer"
    assert tokens["access_token"]
    # Deactivate user
    user_update = UserUpdate(is_active=False)
    user = user_crud.update_user(user_db=user, user_in=user_update)
    # Try to log in again
    response = client.post(f"{settings.API_VERSION_STR}/login/access-token", data=login_data)
    tokens = response.json()
    assert response.status_code == 400
    assert tokens["detail"] == "Inactive user"
    # Reactivate user
    user_update = UserUpdate(is_active=True)
    user = user_crud.update_user(user_db=user, user_in=user_update)


def test_05_get_access_token_user(client: TestClient, setup_user) -> None:
    username, password = setup_user
    login_data = {
        "username": username,
        "password": password,
    }
    response = client.post(f"{settings.API_VERSION_STR}/login/access-token", data=login_data)
    tokens = response.json()
    assert response.status_code == 200
    assert tokens["token_type"] == "bearer"
    assert tokens["access_token"]


def test_06_login_invalid_user(client: TestClient, setup_user) -> None:
    username, password = setup_user
    login_data = {
        "username": username + "noexist",
        "password": password,
    }
    response = client.post(f"{settings.API_VERSION_STR}/login/access-token", data=login_data)
    tokens = response.json()
    assert response.status_code == 400
    assert tokens["detail"] == "Incorrect username or password"


def test_07_login_invalidpassword(client: TestClient, setup_user) -> None:
    username, password = setup_user
    login_data = {
        "username": username,
        "password": password + "invalid",
    }
    response = client.post(f"{settings.API_VERSION_STR}/login/access-token", data=login_data)
    tokens = response.json()
    assert response.status_code == 400
    assert tokens["detail"] == "Incorrect username or password"


def test_08_login_inactive_user(client: TestClient, db: Session, setup_user) -> None:
    username, password = setup_user
    user_crud = UserCRUD(db)
    user = user_crud.get_user_by_email(email=username)

    login_data = {
        "username": username,
        "password": password,
    }
    response = client.post(f"{settings.API_VERSION_STR}/login/access-token", data=login_data)
    tokens = response.json()
    assert response.status_code == 200
    assert tokens["token_type"] == "bearer"
    assert tokens["access_token"]
    # Deactivate user
    user_update = UserUpdate(is_active=False)
    user = user_crud.update_user(user_db=user, user_in=user_update)
    # Try to log in again
    response = client.post(f"{settings.API_VERSION_STR}/login/access-token", data=login_data)
    tokens = response.json()
    assert response.status_code == 400
    assert tokens["detail"] == "Inactive user"
    # Reactivate user
    user_update = UserUpdate(is_active=True)
    user = user_crud.update_user(user_db=user, user_in=user_update)
