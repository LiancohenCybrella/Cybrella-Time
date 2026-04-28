# Cybrella Time — Backend

FastAPI service. See `../docs/architecture.md` for the full plan.

## Setup
```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt   # added in Phase 3
cp .env.example .env
alembic upgrade head              # available Phase 2+
uvicorn app.main:app --reload     # available Phase 3+
```

## Layout
```
app/
├── main.py             FastAPI app entry
├── database.py         SQLAlchemy engine + session
├── core/               config, security, deps
├── models/             SQLAlchemy ORM
├── schemas/            Pydantic v2
├── routes/             auth, users, attendance, admin, holidays
├── services/           business logic
└── utils/email.py      Resend wrapper
alembic/                migrations
tests/                  pytest
```

## Phase Status
This directory is scaffolded in Phase 1. Code lands Phase 2+.
