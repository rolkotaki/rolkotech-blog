from collections.abc import Generator
from fastapi.testclient import TestClient
import logging
import pytest
import sqlalchemy
from sqlalchemy import text
from sqlmodel import SQLModel, Session, delete, create_engine

from app.core.config import settings
from app.db.db import init_db, get_session
from app.main import app
from app.models.models import BlogPost, BlogPostTagLink, Comment, Tag, User
from app.tests.utils.access_tokens import (
    get_superuser_token_headers,
    get_user_token_headers,
)


test_db_name = str(settings.POSTGRES_TEST_DB)
test_db_url = str(settings.TEST_DATABASE_URL)
test_engine = None


def override_get_session() -> Generator[Session]:
    """
    Override the get_session dependency to use the test database.
    """
    if test_engine is None:
        raise RuntimeError("Test engine not initialized.")  # pragma: no cover
    with Session(test_engine) as session:
        yield session


@pytest.fixture(scope="session", autouse=True)
def enable_test_mode():
    original_test_mode = settings.TEST_MODE
    settings.TEST_MODE = True
    logging.disable(logging.CRITICAL)
    yield
    settings.TEST_MODE = original_test_mode


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """
    Create test DB before session, drop it after session.
    """
    global test_engine
    # Connect to default DB to create test DB
    main_db_url = str(settings.TEST_DATABASE_URL).rsplit("/", 1)[0] + "/postgres"
    main_engine = sqlalchemy.create_engine(main_db_url, isolation_level="AUTOCOMMIT")
    with main_engine.connect() as conn:
        if not test_db_url.lower().endswith("test"):
            raise RuntimeError(
                "Refusing to create/drop non-test database!"
            )  # pragma: no cover
        conn.execute(text(f"DROP DATABASE IF EXISTS {test_db_name}"))
        conn.execute(text(f"CREATE DATABASE {test_db_name}"))
    # Create tables in test DB
    test_engine = create_engine(test_db_url)
    SQLModel.metadata.create_all(test_engine)
    # Initialize test DB with superuser
    with Session(test_engine) as session:
        init_db(session)

    yield

    test_engine.dispose()
    with main_engine.connect() as conn:
        conn.execute(text(f"DROP DATABASE IF EXISTS {test_db_name}"))


@pytest.fixture(scope="module", autouse=True)
def delete_tables() -> None:
    with Session(test_engine) as session:
        session.exec(delete(Comment))
        session.exec(delete(BlogPostTagLink))
        session.exec(delete(BlogPost))
        session.exec(delete(Tag))
        session.exec(delete(User))
        session.commit()


@pytest.fixture(scope="module")
def db() -> Generator[Session]:
    with Session(test_engine) as session:
        yield session


@pytest.fixture(scope="module")
def client() -> Generator[TestClient]:
    # Initialize test DB with superuser
    with Session(test_engine) as session:
        init_db(session)
    # Override the get_session dependency to use the test database
    app.dependency_overrides[get_session] = override_get_session
    # Create the test client
    with TestClient(app) as c:
        yield c
    # Clean up the dependency overrides after the test
    app.dependency_overrides.clear()


@pytest.fixture(scope="module")
def superuser_token_headers(client: TestClient) -> dict[str, str]:
    return get_superuser_token_headers(client)


@pytest.fixture(scope="module")
def normal_user_token_headers(client: TestClient) -> dict[str, str]:
    with Session(test_engine) as session:
        ret = get_user_token_headers(client, session)
    return ret
