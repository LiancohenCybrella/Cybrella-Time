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
```

## Quick Start (local dev)

```bash
docker compose up
```
