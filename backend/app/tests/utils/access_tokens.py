from fastapi.testclient import TestClient
from sqlmodel import Session

from app.core.config import settings
from app.db.crud import UserCRUD
from app.schemas.user import UserCreate


def create_test_user(db: Session) -> tuple[str, str]:
    email = settings.TEST_USER_EMAIL
    password = settings.TEST_USER_PASSWORD
    user_crud = UserCRUD(db)
    if not user_crud.get_user_by_email(email=email):
        user_crud.create_user(user=UserCreate(name=settings.TEST_USER,
                                              email=email, 
                                              password=password))
    return email, password


def get_access_token(client: TestClient, username: str, password: str) -> dict[str, str]:
    login_data = {
        "username": username,
        "password": password,
    }
    response = client.post(f"{settings.API_VERSION_STR}/login/access-token", data=login_data)
    tokens = response.json()
    access_token = tokens["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    return headers

def get_superuser_token_headers(client: TestClient) -> dict[str, str]:
    return get_access_token(client, settings.FIRST_SUPERUSER_EMAIL, settings.FIRST_SUPERUSER_PASSWORD)


def get_user_token_headers(client: TestClient, db: Session) -> dict[str, str]:
    username, password = create_test_user(db)
    return get_access_token(client, username, password)
