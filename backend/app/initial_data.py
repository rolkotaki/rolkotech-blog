import logging
from sqlmodel import Session

from app.db.db import engine, init_db


LOG_FORMAT = "%(levelname)s  [%(name)s] %(message)s"

logging.basicConfig(level=logging.INFO, format=LOG_FORMAT)
logger = logging.getLogger("initial_data")


def main():
    logger.info("Initializing the database...")
    with Session(engine) as session:
        init_db(session)
    logger.info("Database initialized successfully.")


if __name__ == "__main__":
    main()
