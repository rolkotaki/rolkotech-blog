from sqlmodel import Session, create_engine, select
from collections.abc import Generator

from app.core.config import settings
from app.db.crud import UserCRUD
from app.logger import logger
from app.models.models import User
from app.schemas.user import UserCreate


engine = create_engine(str(settings.DATABASE_URL))


def get_session() -> Generator[Session]:
    with Session(engine) as session:
        yield session


def init_db(session: Session) -> None:
    """
    Initialize the database with the first superuser if it does not exist.
    """
    try:
        user = session.exec(
            select(User).where(User.email == settings.FIRST_SUPERUSER_EMAIL)
        ).first()
        if not user:
            user_in = UserCreate(
                name=settings.FIRST_SUPERUSER,
                email=settings.FIRST_SUPERUSER_EMAIL,
                password=settings.FIRST_SUPERUSER_PASSWORD,
                is_superuser=True,
            )
            user = UserCRUD(session).create_user(user=user_in)
    except Exception as e:
        session.rollback()
        logger.error(f"Error initializing the database: {e}", exc_info=True)
