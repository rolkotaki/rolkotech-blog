from fastapi.testclient import TestClient
import pytest
from sqlmodel import Session, delete, select

from app.core.config import settings
from app.core.security import verify_password
from app.db.crud import UserCRUD, CommentCRUD, BlogPostCRUD
from app.models.models import Comment
from app.models.models import User
from app.schemas.blog_post import BlogPostCreate
from app.schemas.comment import CommentCreate
from app.schemas.user import UserCreate


@pytest.fixture(scope="function")
def setup_user(db: Session) -> User:
    user = UserCRUD(db).create_user(user=UserCreate(name="user1",
                                                    email="user1@email.com", 
                                                    password="password"))
    return user


@pytest.fixture(scope="function")
def setup_user_auth_headers(client: TestClient, setup_user: User) -> dict[str, str]:
    login_data = {
        "username": setup_user.email,
        "password": "password",
    }
    response = client.post(f"{settings.API_VERSION_STR}/login/access-token", data=login_data)
    tokens = response.json()
    access_token = tokens["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture(scope="function")
def setup_comment(db: Session, setup_user: User) -> Comment:
    blog_post = BlogPostCRUD(db).create_blog_post(blog_post=BlogPostCreate(
                                                               title="Blog Post 1",
                                                               url="blog-post-1",
                                                               content="Content of Blog Post 1",
                                                               image_path="image.png",
                                                               tags=[]))
    comment = CommentCRUD(db).create_comment(comment=CommentCreate(content="This is a comment"),
                                             blog_post_id=blog_post.id,
                                             user_id=setup_user.id)
    return comment


@pytest.fixture(scope="function", autouse=True)
def delete_data(db: Session) -> None:
    db.exec(delete(User).where((User.email != settings.FIRST_SUPERUSER_EMAIL) & 
                               (User.email != settings.TEST_USER_EMAIL)))
    db.commit()


def test_01_read_users(client: TestClient, superuser_token_headers: dict[str, str]) -> None:
    response = client.get(f"{settings.API_VERSION_STR}/users/", headers=superuser_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 1
    assert len(data["data"]) == 1
    assert "id" in data["data"][0]
    assert "name" in data["data"][0]
    assert "email" in data["data"][0]
    assert "is_active" in data["data"][0]
    assert "is_superuser" in data["data"][0]
    assert "creation_date" in data["data"][0]
    assert "password" not in data["data"][0]


def test_02_read_users_with_skip_and_limit(client: TestClient, db: Session, 
                                           superuser_token_headers: dict[str, str]) -> None:
    user_1 = UserCRUD(db).create_user(user=UserCreate(name="user1",
                                                      email="user1@email.com", 
                                                      password="password"))
    user_2 = UserCRUD(db).create_user(user=UserCreate(name="user2",
                                                      email="user2@email.com", 
                                                      password="password"))
    user_3 = UserCRUD(db).create_user(user=UserCreate(name="user3",
                                                      email="user3@email.com", 
                                                      password="password"))
    user_4 = UserCRUD(db).create_user(user=UserCreate(name="user4",
                                                      email="user4@email.com", 
                                                      password="password"))
    response = client.get(f"{settings.API_VERSION_STR}/users/?skip=2&limit=2", 
                          headers=superuser_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["count"] == 5  # With the superuser included
    assert len(data["data"]) == 2
    assert data["data"][0]["id"] == str(user_2.id)
    assert data["data"][0]["name"] == user_2.name
    assert data["data"][0]["email"] == user_2.email
    assert data["data"][0]["is_active"] == user_2.is_active
    assert data["data"][0]["is_superuser"] == user_2.is_superuser
    assert data["data"][0]["creation_date"] == user_2.creation_date.isoformat()
    assert data["data"][1]["id"] == str(user_3.id)
    assert data["data"][1]["name"] == user_3.name
    assert data["data"][1]["email"] == user_3.email
    assert data["data"][1]["is_active"] == user_3.is_active
    assert data["data"][1]["is_superuser"] == user_3.is_superuser
    assert data["data"][1]["creation_date"] == user_3.creation_date.isoformat()
    assert "password" not in data["data"][0]
    assert "password" not in data["data"][1]
    

def test_03_read_users_without_admin_privilege(client: TestClient, 
                                               normal_user_token_headers: dict[str, str]) -> None:
    response = client.get(f"{settings.API_VERSION_STR}/users/", headers=normal_user_token_headers)
    assert response.status_code == 403
    data = response.json()
    assert data["detail"] == "The user does not have admin privileges"


def test_04_read_user_me(client: TestClient, normal_user_token_headers: dict[str, str]) -> None:
    response = client.get(f"{settings.API_VERSION_STR}/users/me", headers=normal_user_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "name" in data
    assert "email" in data
    assert "is_active" in data
    assert "is_superuser" in data
    assert "creation_date" in data
    assert "password" not in data
    assert data["email"] == settings.TEST_USER_EMAIL
    assert not data["is_superuser"]


def test_05_read_user_me_superuser(client: TestClient, superuser_token_headers: dict[str, str]) -> None:
    response = client.get(f"{settings.API_VERSION_STR}/users/me", headers=superuser_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "name" in data
    assert "email" in data
    assert "is_active" in data
    assert "is_superuser" in data
    assert "creation_date" in data
    assert "password" not in data
    assert data["email"] == settings.FIRST_SUPERUSER_EMAIL
    assert data["is_superuser"]


def test_06_read_user_me_invalid_credentials(client: TestClient) -> None:
    response = client.get(f"{settings.API_VERSION_STR}/users/me", 
                          headers={"Authorization": f"Bearer invalid_token"})
    assert response.status_code == 401
    data = response.json()
    assert data["detail"] == "Could not validate credentials"


def test_07_read_user_me_inactive(client: TestClient, db: Session, 
                                  normal_user_token_headers: dict[str, str]) -> None:
    user = UserCRUD(db).get_user_by_email(email=settings.TEST_USER_EMAIL)
    user.is_active = False
    db.add(user)
    db.commit()
    db.refresh(user)
    response = client.get(f"{settings.API_VERSION_STR}/users/me", headers=normal_user_token_headers)
    assert response.status_code == 400
    data = response.json()
    assert data["detail"] == "User is inactive"
    
    # Revert changes
    user.is_active = True
    db.add(user)
    db.commit()
    db.refresh(user)


def test_08_read_user_me_not_exist(client: TestClient, db: Session, setup_user: User, 
                                   setup_user_auth_headers: dict[str, str]) -> None:
    # Delete setup_user
    db.delete(setup_user)
    db.commit()
    # Call endpoint with setup_user token
    response = client.get(f"{settings.API_VERSION_STR}/users/me", headers=setup_user_auth_headers)
    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "User not found"


def test_09_read_user_by_id_normal_user(client: TestClient, db: Session, 
                                        normal_user_token_headers: dict[str, str]) -> None:
    user = UserCRUD(db).get_user_by_email(email=settings.TEST_USER_EMAIL)
    response = client.get(f"{settings.API_VERSION_STR}/users/{user.id}", headers=normal_user_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "name" in data
    assert "email" in data
    assert "is_active" in data
    assert "is_superuser" in data
    assert "creation_date" in data
    assert "password" not in data
    assert data["email"] == settings.TEST_USER_EMAIL
    assert not data["is_superuser"]


def test_10_read_user_by_id_superuser(client: TestClient, db: Session, 
                                      superuser_token_headers: dict[str, str]) -> None:
    user = UserCRUD(db).get_user_by_email(email=settings.FIRST_SUPERUSER_EMAIL)
    response = client.get(f"{settings.API_VERSION_STR}/users/{user.id}", headers=superuser_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "name" in data
    assert "email" in data
    assert "is_active" in data
    assert "is_superuser" in data
    assert "creation_date" in data
    assert "password" not in data
    assert data["email"] == settings.FIRST_SUPERUSER_EMAIL
    assert data["is_superuser"]


def test_11_read_user_by_id_superuser_other_user(client: TestClient, db: Session, 
                                                 superuser_token_headers: dict[str, str]) -> None:
    user = UserCRUD(db).get_user_by_email(email=settings.TEST_USER_EMAIL)
    response = client.get(f"{settings.API_VERSION_STR}/users/{user.id}", headers=superuser_token_headers)
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    assert "name" in data
    assert "email" in data
    assert "is_active" in data
    assert "is_superuser" in data
    assert "creation_date" in data
    assert "password" not in data
    assert data["email"] == settings.TEST_USER_EMAIL
    assert not data["is_superuser"]


def test_12_read_user_by_id_superuser(client: TestClient, setup_user: User, 
                                      normal_user_token_headers: dict[str, str]) -> None:
    response = client.get(f"{settings.API_VERSION_STR}/users/{setup_user.id}", 
                          headers=normal_user_token_headers)
    assert response.status_code == 403
    data = response.json()
    assert data["detail"] == "The user does not have enough privileges"


def test_13_register_user(client: TestClient, db: Session) -> None:
    data = {"name": "new_user", "email": "new_user@email.com", "password": "password"}
    response = client.post(f"{settings.API_VERSION_STR}/users/signup", json=data)
    assert response.status_code == 200
    created_user = response.json()
    assert created_user["name"] == data["name"]
    assert created_user["email"] == data["email"]
    assert created_user["is_active"] is True
    assert created_user["is_superuser"] is False
    assert created_user["creation_date"] is not None

    user_query = select(User).where(User.email == data["email"])
    user_db = db.exec(user_query).first()
    assert user_db
    assert user_db.email == data["email"]
    assert user_db.name == data["name"]
    assert user_db.is_active is True
    assert user_db.is_superuser is False
    assert user_db.creation_date is not None
    assert verify_password(data["password"], user_db.password)


def test_14_register_user_invalid_username(client: TestClient) -> None:
    data = {"name": "", "email": "new_user@email.com", "password": "password"}
    response = client.post(f"{settings.API_VERSION_STR}/users/signup", json=data)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert data["detail"][0]["msg"] == "String should have at least 1 character"


def test_15_register_user_invalid_email(client: TestClient) -> None:
    data = {"name": "username", "email": "", "password": "password"}
    response = client.post(f"{settings.API_VERSION_STR}/users/signup", json=data)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    print(data["detail"][0]["msg"])
    assert data["detail"][0]["msg"] == "value is not a valid email address: An email address must have an @-sign."

    data = {"name": "username", "email": "something.com", "password": "password"}
    response = client.post(f"{settings.API_VERSION_STR}/users/signup", json=data)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    print(data["detail"][0]["msg"])
    assert data["detail"][0]["msg"] == "value is not a valid email address: An email address must have an @-sign."

    data = {"name": "username", "email": "something@email", "password": "password"}
    response = client.post(f"{settings.API_VERSION_STR}/users/signup", json=data)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    print(data["detail"][0]["msg"])
    assert data["detail"][0]["msg"] == "value is not a valid email address: The part after the @-sign is not valid. It should have a period."


def test_16_register_user_username_exists(client: TestClient, setup_user: User) -> None:
    data = {"name": setup_user.name, "email": "new_user@email.com", "password": "password"}
    response = client.post(f"{settings.API_VERSION_STR}/users/signup", json=data)
    assert response.status_code == 400
    created_user = response.json()
    assert created_user["detail"] == "The user with this name already exists"


def test_17_register_user_email_exists(client: TestClient, setup_user: User) -> None:
    data = {"name": "new_user", "email": setup_user.email, "password": "password"}
    response = client.post(f"{settings.API_VERSION_STR}/users/signup", json=data)
    assert response.status_code == 400
    created_user = response.json()
    assert created_user["detail"] == "The user with this email already exists"


def test_18_create_user(client: TestClient, db: Session, superuser_token_headers: dict[str, str]) -> None:
    data = {"name": "new_user", "email": "new_user@email.com", "password": "password", 
            "is_active": True, "is_superuser": False}
    response = client.post(f"{settings.API_VERSION_STR}/users/", headers=superuser_token_headers, json=data)
    assert response.status_code == 200
    created_user = response.json()
    assert created_user["name"] == data["name"]
    assert created_user["email"] == data["email"]
    assert created_user["is_active"] == data["is_active"]
    assert created_user["is_superuser"] == data["is_superuser"]
    assert created_user["creation_date"] is not None

    user_query = select(User).where(User.email == data["email"])
    user_db = db.exec(user_query).first()
    assert user_db
    assert user_db.email == data["email"]
    assert user_db.name == data["name"]
    assert user_db.is_active == data["is_active"]
    assert user_db.is_superuser == data["is_superuser"]
    assert user_db.creation_date is not None
    assert verify_password(data["password"], user_db.password)


def test_19_create_user_username_invalid_data(client: TestClient, superuser_token_headers: dict[str, str]) -> None:
    data = {"name": "", "email": "new_user@email.com", "password": "password", 
            "is_active": True, "is_superuser": False}
    response = client.post(f"{settings.API_VERSION_STR}/users/", headers=superuser_token_headers, json=data)
    assert response.status_code == 422
    data = response.json()
    assert "detail" in data
    assert data["detail"][0]["msg"] == "String should have at least 1 character"


def test_20_create_user_username_exists(client: TestClient, setup_user: User, 
                                        superuser_token_headers: dict[str, str]) -> None:
    data = {"name": setup_user.name, "email": "new_user@email.com", "password": "password", 
            "is_active": True, "is_superuser": False}
    response = client.post(f"{settings.API_VERSION_STR}/users/", headers=superuser_token_headers, json=data)
    assert response.status_code == 400
    created_user = response.json()
    assert created_user["detail"] == "The user with this name already exists"


def test_21_create_user_email_exists(client: TestClient, setup_user: User, 
                                     superuser_token_headers: dict[str, str]) -> None:
    data = {"name": "new_user", "email": setup_user.email, "password": "password", 
            "is_active": True, "is_superuser": False}
    response = client.post(f"{settings.API_VERSION_STR}/users/", headers=superuser_token_headers, json=data)
    assert response.status_code == 400
    created_user = response.json()
    assert created_user["detail"] == "The user with this email already exists"


def test_22_create_user_without_admin_privilege(client: TestClient, 
                                                normal_user_token_headers: dict[str, str]) -> None:
    data = {"name": "new_user", "email": "new_user@email.com", "password": "password", 
            "is_active": True, "is_superuser": False}
    response = client.post(f"{settings.API_VERSION_STR}/users/", headers=normal_user_token_headers, json=data)
    assert response.status_code == 403
    created_user = response.json()
    assert created_user["detail"] == "The user does not have admin privileges"


def test_23_update_user_me(client: TestClient, db: Session, normal_user_token_headers: dict[str, str]) -> None:
    user = UserCRUD(db).get_user_by_email(email=settings.TEST_USER_EMAIL)
    data = {"name": "updated_user", "email": "updated_user@email.com"}
    response = client.patch(f"{settings.API_VERSION_STR}/users/me", headers=normal_user_token_headers, json=data)
    assert response.status_code == 200
    created_user = response.json()
    assert created_user["name"] == data["name"]
    assert created_user["email"] == data["email"]
    assert created_user["is_active"] == user.is_active
    assert created_user["is_superuser"] == user.is_superuser
    assert created_user["creation_date"] == user.creation_date.isoformat()
    assert created_user["id"] == str(user.id)
    # Revert changes
    data = {"name": settings.TEST_USER, "email": settings.TEST_USER_EMAIL}
    client.patch(f"{settings.API_VERSION_STR}/users/me", headers=normal_user_token_headers, json=data)
    assert response.status_code == 200


def test_24_update_user_me_username_exists(client: TestClient, setup_user: User, 
                                           normal_user_token_headers: dict[str, str]) -> None:
    data = {"name": setup_user.name}
    response = client.patch(f"{settings.API_VERSION_STR}/users/me", 
                            headers=normal_user_token_headers, json=data)
    assert response.status_code == 409
    created_user = response.json()
    assert created_user["detail"] == "User with this name already exists"


def test_25_update_user_me_email_exists(client: TestClient, setup_user: User, 
                                        normal_user_token_headers: dict[str, str]) -> None:
    data = {"email": setup_user.email}
    response = client.patch(f"{settings.API_VERSION_STR}/users/me", 
                            headers=normal_user_token_headers, json=data)
    assert response.status_code == 409
    created_user = response.json()
    assert created_user["detail"] == "User with this email already exists"


def test_26_update_user_me_unauthorized(client: TestClient) -> None:
    data = {"email": "updated_user@email.com"}
    response = client.patch(f"{settings.API_VERSION_STR}/users/me", 
                            headers={"Authorization": f"Bearer invalid_token"}, json=data)
    assert response.status_code == 401
    created_user = response.json()
    assert created_user["detail"] == "Could not validate credentials"


def test_27_update_user(client: TestClient, setup_user: User, superuser_token_headers: dict[str, str]) -> None:
    data = {"name": "updated_user"}
    response = client.patch(f"{settings.API_VERSION_STR}/users/{setup_user.id}", 
                            headers=superuser_token_headers, json=data)
    assert response.status_code == 200
    created_user = response.json()
    assert created_user["name"] == data["name"]
    assert created_user["email"] == setup_user.email
    assert created_user["is_active"] == setup_user.is_active
    assert created_user["is_superuser"] == setup_user.is_superuser
    assert created_user["creation_date"] == setup_user.creation_date.isoformat()
    assert created_user["id"] == str(setup_user.id)


def test_28_update_user_everything(client: TestClient, db: Session, setup_user: User, 
                                   superuser_token_headers: dict[str, str]) -> None:
    data = {"name": "updated_user", "email": "updated_user@email.com", "is_active": False,
            "is_superuser": True, "password": "updated_password"}
    response = client.patch(f"{settings.API_VERSION_STR}/users/{setup_user.id}", 
                            headers=superuser_token_headers, json=data)
    assert response.status_code == 200
    created_user = response.json()
    db.refresh(setup_user)

    assert created_user["name"] == data["name"]
    assert created_user["email"] == data["email"]
    assert created_user["is_active"] == data["is_active"]
    assert created_user["is_superuser"] == data["is_superuser"]
    assert verify_password(data["password"], setup_user.password)
    assert created_user["creation_date"] == setup_user.creation_date.isoformat()
    assert created_user["id"] == str(setup_user.id)


def test_29_update_user_without_admin_privilege(client: TestClient, setup_user: User, 
                                                normal_user_token_headers: dict[str, str]) -> None:
    data = {"name": "updated_user"}
    response = client.patch(f"{settings.API_VERSION_STR}/users/{setup_user.id}", 
                     headers=normal_user_token_headers, json=data)
    assert response.status_code == 403
    created_user = response.json()
    assert created_user["detail"] == "The user does not have admin privileges"


def test_30_update_user_demote_current_superuser(client: TestClient, db: Session, 
                                                 superuser_token_headers: dict[str, str]) -> None:
    user = UserCRUD(db).get_user_by_email(email=settings.FIRST_SUPERUSER_EMAIL)
    data = {"is_superuser": False}
    response = client.patch(f"{settings.API_VERSION_STR}/users/{user.id}", 
                            headers=superuser_token_headers, json=data)
    assert response.status_code == 403
    created_user = response.json()
    assert created_user["detail"] == "Super users cannot demote themselves"


def test_31_update_user_without_admin_privilege(client: TestClient, db: Session, setup_user: User, 
                                                superuser_token_headers: dict[str, str]) -> None:
    user_id = setup_user.id
    db.delete(setup_user)
    db.commit()
    data = {"name": "updated_user"}
    response = client.patch(f"{settings.API_VERSION_STR}/users/{user_id}", 
                            headers=superuser_token_headers, json=data)
    assert response.status_code == 404
    created_user = response.json()
    assert created_user["detail"] == "User not found"


def test_32_update_user_username_exists(client: TestClient, setup_user: User, 
                                        superuser_token_headers: dict[str, str]) -> None:
    data = {"name": settings.TEST_USER}
    response = client.patch(f"{settings.API_VERSION_STR}/users/{setup_user.id}", 
                            headers=superuser_token_headers, json=data)
    assert response.status_code == 409
    created_user = response.json()
    assert created_user["detail"] == "User with this name already exists"


def test_33_update_user_email_exists(client: TestClient, setup_user: User, 
                                     superuser_token_headers: dict[str, str]) -> None:
    data = {"email": settings.TEST_USER_EMAIL}
    response = client.patch(f"{settings.API_VERSION_STR}/users/{setup_user.id}", 
                            headers=superuser_token_headers, json=data)
    assert response.status_code == 409
    created_user = response.json()
    assert created_user["detail"] == "User with this email already exists"


def test_34_update_password_me(client: TestClient, normal_user_token_headers: dict[str, str]) -> None:
    updated_password = "updated_password_999"
    data = {"current_password": settings.TEST_USER_PASSWORD, "new_password": updated_password}
    response = client.patch(f"{settings.API_VERSION_STR}/users/me/password", 
                            headers=normal_user_token_headers, json=data)
    assert response.status_code == 200
    created_user = response.json()
    assert created_user["message"] == "Password updated successfully"
    # Reset password to original
    data = {"current_password": updated_password, "new_password": settings.TEST_USER_PASSWORD}
    response = client.patch(f"{settings.API_VERSION_STR}/users/me/password", 
                            headers=normal_user_token_headers, json=data)
    assert response.status_code == 200


def test_35_update_password_me_incorrect_password(client: TestClient, 
                                                  normal_user_token_headers: dict[str, str]) -> None:
    data = {"current_password": settings.TEST_USER_PASSWORD + "invalid", "new_password": "updated_password_999"}
    response = client.patch(f"{settings.API_VERSION_STR}/users/me/password", 
                            headers=normal_user_token_headers, json=data)
    assert response.status_code == 400
    created_user = response.json()
    assert created_user["detail"] == "Incorrect password"


def test_36_update_password_me_same_password(client: TestClient, 
                                             normal_user_token_headers: dict[str, str]) -> None:
    data = {"current_password": settings.TEST_USER_PASSWORD, "new_password": settings.TEST_USER_PASSWORD}
    response = client.patch(f"{settings.API_VERSION_STR}/users/me/password", 
                            headers=normal_user_token_headers, json=data)
    assert response.status_code == 400
    created_user = response.json()
    assert created_user["detail"] == "New password cannot be the same as the current one"


def test_37_update_password_me_not_current_user(client: TestClient, 
                                                setup_user_auth_headers: dict[str, str]) -> None:    
    data = {"current_password": settings.TEST_USER_PASSWORD, "new_password": "updated_password_999"}
    # Call endpoint with setup_user token
    response = client.patch(f"{settings.API_VERSION_STR}/users/me/password", 
                            headers=setup_user_auth_headers, json=data)
    assert response.status_code == 400
    created_user = response.json()
    assert created_user["detail"] == "Incorrect password"


def test_38_delete_user_me(client: TestClient, db: Session, setup_user: User,
                           setup_user_auth_headers: dict[str, str]) -> None:
    user_id = setup_user.id
    response = client.delete(f"{settings.API_VERSION_STR}/users/me", headers=setup_user_auth_headers)
    assert response.status_code == 200
    created_user = response.json()
    assert created_user["message"] == "User deleted successfully"
    
    # Check if user is deleted from DB
    db.expire_all()
    user_db = db.get(User, user_id)
    assert not user_db


def test_39_delete_user_me_superuser(client: TestClient, superuser_token_headers: dict[str, str]) -> None:
    response = client.delete(f"{settings.API_VERSION_STR}/users/me", headers=superuser_token_headers)
    assert response.status_code == 403
    created_user = response.json()
    assert created_user["detail"] == "Super users are not allowed to delete themselves"


def test_40_delete_user_me_not_exist(client: TestClient, db: Session, setup_user: User,
                                     setup_user_auth_headers: dict[str, str]) -> None:
    # Delete setup_user
    db.delete(setup_user)
    db.commit()
    
    # Call endpoint with setup_user token
    response = client.delete(f"{settings.API_VERSION_STR}/users/me", headers=setup_user_auth_headers)
    assert response.status_code == 404
    created_user = response.json()
    assert created_user["detail"] == "User not found"


def test_41_delete_user_me_unauthorized(client: TestClient) -> None:
    response = client.delete(f"{settings.API_VERSION_STR}/users/me", 
                             headers={"Authorization": f"Bearer invalid_token"})
    assert response.status_code == 401
    created_user = response.json()
    assert created_user["detail"] == "Could not validate credentials"


def test_42_delete_user(client: TestClient, db: Session, superuser_token_headers: dict[str, str], 
                        setup_user: User) -> None:
    user_id = setup_user.id
    response = client.delete(f"{settings.API_VERSION_STR}/users/{user_id}", headers=superuser_token_headers)
    assert response.status_code == 200
    created_user = response.json()
    assert created_user["message"] == "User deleted successfully"
    # Check if user is deleted from DB
    db.expire_all()
    user_db = db.get(User, user_id)
    assert not user_db


def test_43_delete_user_without_admin_privilege(client: TestClient, setup_user: User, 
                                                normal_user_token_headers: dict[str, str]) -> None:
    user_id = setup_user.id
    response = client.delete(f"{settings.API_VERSION_STR}/users/{user_id}", headers=normal_user_token_headers)
    assert response.status_code == 403
    created_user = response.json()
    assert created_user["detail"] == "The user does not have admin privileges"


def test_44_delete_user_not_exist(client: TestClient, db: Session, superuser_token_headers: dict[str, str], 
                                  setup_user: User) -> None:
    user_id = setup_user.id
    db.delete(setup_user)
    db.commit()
    response = client.delete(f"{settings.API_VERSION_STR}/users/{user_id}", headers=superuser_token_headers)
    assert response.status_code == 404
    created_user = response.json()
    assert created_user["detail"] == "User not found"


def test_45_delete_user_superuser(client: TestClient, db: Session, 
                                  superuser_token_headers: dict[str, str]) -> None:
    user = UserCRUD(db).get_user_by_email(email=settings.FIRST_SUPERUSER_EMAIL)
    response = client.delete(f"{settings.API_VERSION_STR}/users/{user.id}", headers=superuser_token_headers)
    assert response.status_code == 403
    created_user = response.json()
    assert created_user["detail"] == "Super users are not allowed to delete themselves"


def test_46_delete_user_unauthorized(client: TestClient) -> None:
    response = client.delete(f"{settings.API_VERSION_STR}/users/1", 
                             headers={"Authorization": f"Bearer invalid_token"})
    assert response.status_code == 401
    created_user = response.json()
    assert created_user["detail"] == "Could not validate credentials"


def test_47_delete_user_with_comment(client: TestClient, db: Session, setup_user: User, setup_comment: Comment,
                                     superuser_token_headers: dict[str, str], ) -> None:
    user_id = setup_user.id
    comment_id = setup_comment.id
    response = client.delete(f"{settings.API_VERSION_STR}/users/{user_id}", headers=superuser_token_headers)
    assert response.status_code == 200
    created_user = response.json()
    assert created_user["message"] == "User deleted successfully"
    # Check if user is deleted from DB
    db.expire_all()
    user_db = db.get(User, user_id)
    assert not user_db
    # Check that comment is deleted from DB
    comment_db = db.get(Comment, comment_id)
    assert not comment_db
