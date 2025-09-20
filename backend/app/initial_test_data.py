import logging
from sqlmodel import Session, delete, select

from app.core.config import settings
from app.db.crud import UserCRUD
from app.db.db import engine, init_db
from app.models.models import User, Tag, BlogPost, BlogPostTagLink, Comment
from app.schemas.user import UserCreate


LOG_FORMAT = "%(levelname)s  [%(name)s] %(message)s"

logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)
logger = logging.getLogger("initial_test_data")


def clean_tables(session: Session) -> None:
    """
    Clean database tables.
    """
    try:
        session.exec(delete(Comment))
        session.exec(delete(BlogPostTagLink))
        session.exec(delete(BlogPost))
        session.exec(delete(Tag))
        # session.exec(delete(User))
        session.commit()
    except Exception as e:
        session.rollback()
        logger.error(f"Error cleaning the database tables: {e}", exc_info=True)


def init_test_user(session: Session) -> None:
    """
    Create the test user in the database.
    """
    try:
        user = session.exec(
            select(User).where(User.email == settings.TEST_USER_EMAIL)
        ).first()
        user_crud = UserCRUD(session)
        if user:
            user_crud.delete_user(user)
        user_in = UserCreate(
            name=settings.TEST_USER,
            email=settings.TEST_USER_EMAIL,
            password=settings.TEST_USER_PASSWORD,
        )
        user = user_crud.create_user(user=user_in)
    except Exception as e:
        session.rollback()
        logger.error(f"Error creating the test user: {e}", exc_info=True)


def init_test_playwright_user(session: Session) -> None:
    """
    Create the test playwright user in the database.
    """
    try:
        user = session.exec(
            select(User).where(User.email == settings.TEST_PLAYWRIGHT_USER_EMAIL)
        ).first()
        user_crud = UserCRUD(session)
        if user:
            user_crud.delete_user(user)
        user_in = UserCreate(
            name=settings.TEST_PLAYWRIGHT_USER,
            email=settings.TEST_PLAYWRIGHT_USER_EMAIL,
            password=settings.TEST_PLAYWRIGHT_USER_PASSWORD,
        )
        user = user_crud.create_user(user=user_in)
    except Exception as e:
        session.rollback()
        logger.error(f"Error creating the test playwright user: {e}", exc_info=True)


def main():
    logger.info("Initializing the database with test data...")
    with Session(engine) as session:
        init_db(session)
        clean_tables(session)
        init_test_user(session)
        init_test_playwright_user(session)
    logger.info("Database initialized with test data successfully.")


if __name__ == "__main__":
    main()
