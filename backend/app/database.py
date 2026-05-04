from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import settings


def _coerce_postgres_driver(url: str) -> str:
    # Railway / Heroku-style URLs use postgres:// or postgresql:// which makes
    # SQLAlchemy try the (uninstalled) psycopg2 driver. Force psycopg3 explicitly.
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://") :]
    return url


engine = create_engine(
    _coerce_postgres_driver(settings.DATABASE_URL), pool_pre_ping=True, future=True
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, future=True)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
