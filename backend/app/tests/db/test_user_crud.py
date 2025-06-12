from datetime import datetime
import pytest
from sqlmodel import Session, select, func, delete
from uuid import UUID

from app.core.security import verify_password
from app.db.crud import UserCRUD
from app.models.models import User
from app.schemas.user import UserCreate, UserUpdate, UserUpdateMe, UserRegister


@pytest.fixture(scope="function", autouse=True)
def delete_data(db: Session) -> None:
    db.exec(delete(User))
    db.commit()


def test_01_create_user(db: Session) -> None:
    username = "testuser"
    email = "test@email.com"
    password = "testpassword"
    user_create = UserCreate(name=username, email=email, password=password)
    user = UserCRUD(db).create_user(user=user_create)
    
    assert user.id is not None and type(user.id) is UUID
    assert user.name == username
    assert user.email == email
    assert verify_password(password, user.password)
    assert user.is_active is True
    assert user.is_superuser is False
    assert user.creation_date is not None and type(user.creation_date) is datetime


def test_02_create_superuser(db: Session) -> None:
    username = "testuser"
    email = "test@email.com"
    password = "testpassword"
    user_create = UserCreate(name=username, email=email, password=password, 
                             is_superuser=True, is_active=False)
    user = UserCRUD(db).create_user(user=user_create)
    
    assert user.name == username
    assert user.email == email
    assert user.is_active is False
    assert user.is_superuser is True


def test_03_register_user(db: Session) -> None:
    username = "testuser"
    email = "test@email.com"
    password = "testpassword"
    user_create = UserRegister(name=username, email=email, password=password)
    user = UserCRUD(db).create_user(user=user_create)
    
    assert user.id is not None and type(user.id) is UUID
    assert user.name == username
    assert user.email == email
    assert verify_password(password, user.password)
    assert user.is_active is False
    assert user.is_superuser is False
    assert user.creation_date is not None and type(user.creation_date) is datetime


def test_04_read_users(db: Session) -> None:
    user_crud = UserCRUD(db)
    count, users = user_crud.read_users(skip=0, limit=2)
    assert count == 0
    assert len(users) == 0

    user_1 = user_crud.create_user(user=UserCreate(name="user1", email="user1@email.com", 
                                                   password="password"))
    user_2 = user_crud.create_user(user=UserCreate(name="user2", email="user2@email.com", 
                                                   password="password", superuser=True))
    
    count, users = user_crud.read_users(skip=0, limit=2)
    assert count == 2
    assert len(users) == 2

    count, users = user_crud.read_users(skip=0, limit=1)
    assert count == 2
    assert len(users) == 1

    count, users = user_crud.read_users(skip=1, limit=2)
    assert count == 2
    assert len(users) == 1

    count, users = user_crud.read_users(skip=2, limit=2)
    assert count == 2
    assert len(users) == 0


def test_05_get_user_by_email(db: Session) -> None:
    email = "user1@email.com"
    name = "user1"

    user_crud = UserCRUD(db)
    user = user_crud.get_user_by_email(email=email)
    assert user is None

    user_1 = user_crud.create_user(user=UserCreate(name=name, email=email, password="password"))
    user_2 = user_crud.create_user(user=UserCreate(name="user2", email="user2@email.com", 
                                                   password="password", superuser=True))
    
    user = user_crud.get_user_by_email(email=email)
    assert user is not None
    assert user.name == name


def test_06_get_user_by_name(db: Session) -> None:
    email = "user1@email.com"
    name = "user1"

    user_crud = UserCRUD(db)
    user = user_crud.get_user_by_name(username=name)
    assert user is None

    user_1 = user_crud.create_user(user=UserCreate(name=name, email=email, password="password"))
    user_2 = user_crud.create_user(user=UserCreate(name="user2", email="user2@email.com",
                                                   password="password", superuser=True))
    
    user = user_crud.get_user_by_name(username=name)
    assert user is not None
    assert user.name == name


def test_07_update_user(db: Session) -> None:
    user_crud = UserCRUD(db)
    user = user_crud.create_user(user=UserCreate(name="user1", email="user1@email.com", 
                                                 password="password"))
    user_update = UserUpdate(name="user1_updated")
    user_updated = user_crud.update_user(user_db=user, user_in=user_update)

    assert user_updated.name == user_update.name
    assert user_updated.email == user.email
    assert user_updated.password == user.password
    assert user_updated.is_active == user.is_active
    assert user_updated.is_superuser == user.is_superuser
    assert user_updated.creation_date == user.creation_date
    assert user_updated.id == user.id

    user_update = UserUpdate(name="user1_updated", email="updated@email.com", password="newpassword", 
                             is_active=False, is_superuser=True)
    user_updated_again = user_crud.update_user(user_db=user, user_in=user_update)

    assert user_updated_again.name == user_update.name
    assert user_updated_again.email == user_update.email
    assert verify_password(user_update.password.get_secret_value(), user_updated_again.password)
    assert user_updated_again.is_active == user_update.is_active
    assert user_updated_again.is_superuser == user_update.is_superuser
    assert user_updated_again.creation_date == user.creation_date
    assert user_updated_again.id == user.id


def test_08_update_user_me(db: Session) -> None:
    user_crud = UserCRUD(db)
    user = user_crud.create_user(user=UserCreate(name="user1", email="user1@email.com", 
                                                 password="password"))
    user_update_me = UserUpdateMe(name="user1_updated", email="updated@email.com")
    user_updated = user_crud.update_user(user_db=user, user_in=user_update_me)

    assert user_updated.name == user_update_me.name
    assert user_updated.email == user_update_me.email
    assert user_updated.password == user.password
    assert user_updated.is_active == user.is_active
    assert user_updated.is_superuser == user.is_superuser
    assert user_updated.creation_date == user.creation_date
    assert user_updated.id == user.id


def test_09_delete_user(db: Session) -> None:
    user_crud = UserCRUD(db)
    user = user_crud.create_user(user=UserCreate(name="user1", email="user1@email.com", 
                                                 password="password"))
    count = db.exec(select(func.count()).select_from(User)).one()
    assert count == 1
    user_crud.delete_user(user_db=user)
    count = db.exec(select(func.count()).select_from(User)).one()
    assert count == 0
