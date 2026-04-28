# Cybrella Time

Internal HR time-attendance web app for Cybrella employees. Monthly self-reporting (check-in/out, day type, notes), admin review/approve/export.

## Stack
- **Backend:** FastAPI (Python 3.12), SQLAlchemy 2.x, Alembic, PostgreSQL
- **Frontend:** React + Vite + TypeScript, Tailwind, React Router, Axios
- **Auth:** JWT, bcrypt, domain-restricted to `@cybrella.io`
- **Email:** Resend
- **Deploy:** Railway (backend + DB), Vercel (frontend)

## Repo Layout
```
backend/    FastAPI service
frontend/   Vite SPA
docs/       Architecture & build plan
```

## Quick Start (local dev)
See `docs/architecture.md` for full plan. Local dev requires Postgres (docker-compose available from Phase 2 onward).

```bash
# backend
cd backend && python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill values
alembic upgrade head
uvicorn app.main:app --reload

# frontend
cd frontend && npm install
cp .env.example .env  # fill VITE_API_URL
npm run dev
```

## Build Phases
This repo is built phase-by-phase; see `docs/architecture.md` §7 for the phase table. Each phase lands as a feature branch + PR into `main`.

## License
MIT — see `LICENSE`.
