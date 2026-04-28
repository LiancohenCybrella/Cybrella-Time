import os

os.environ.setdefault("DATABASE_URL", "sqlite+pysqlite:///:memory:")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-do-not-use-in-prod")
os.environ.setdefault("ALLOWED_EMAIL_DOMAIN", "cybrella.io")
os.environ.setdefault("INITIAL_ADMIN_EMAIL", "lianc@cybrella.io")
os.environ.setdefault("FRONTEND_URL", "http://localhost:5173")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app import database
from app.core.config import settings  # noqa: E402
from app.database import Base, get_db
from app.main import app


# Patch CITEXT for SQLite tests
from sqlalchemy.dialects.postgresql import CITEXT
from sqlalchemy import String


@event.listens_for(Base.metadata, "before_create")
def _patch_citext(_, connection, **__):
    if connection.dialect.name != "postgresql":
        for table in Base.metadata.tables.values():
            for col in table.columns:
                if isinstance(col.type, CITEXT):
                    col.type = String()


@pytest.fixture
def db_session():
    engine = create_engine("sqlite+pysqlite:///:memory:", future=True)
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
