import pytest
import sqlalchemy
from sqlalchemy import text
from sqlmodel import SQLModel, Session, delete, create_engine
from typing import Generator

from app.core.config import settings
from app.db.db import init_db
from app.models.models import BlogPost, BlogPostTagLink, Comment, Tag, User


test_db_name = str(settings.POSTGRES_TEST_DB)
test_db_url = str(settings.TEST_DATABASE_URL)
test_engine = None


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
            raise RuntimeError("Refusing to create/drop non-test database!")
        conn.execute(text("DROP DATABASE IF EXISTS {}".format(test_db_name)))
        conn.execute(text("CREATE DATABASE {}".format(test_db_name)))
    # Create tables in test DB
    test_engine = create_engine(test_db_url)
    SQLModel.metadata.create_all(test_engine)
    # Initialize test DB with superuser
    with Session(test_engine) as session:
        init_db(session)

    yield

    test_engine.dispose()
    with main_engine.connect() as conn:
        conn.execute(text("DROP DATABASE IF EXISTS {}".format(test_db_name)))


@pytest.fixture(scope="module", autouse=True)
def delete_tables() -> None:
    with Session(test_engine) as session:
        session.exec(delete(Comment))
        session.exec(delete(BlogPostTagLink))
        session.exec(delete(BlogPost))
        session.exec(delete(Tag))
        session.exec(delete(User))
        session.commit()


@pytest.fixture
def db() -> Generator[Session, None, None]:
    with Session(test_engine) as session:
        yield session
