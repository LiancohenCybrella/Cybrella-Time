# Cybrella Time — Architecture & Build Plan

## Context

**Cybrella Time** is an internal HR time-attendance web app for ~30 employees + 1 admin (initial admin: `lianc@cybrella.io`). Employees report monthly attendance manually (check-in/out, day type, notes); HR/admin reviews, approves, edits, and exports. This plan covers the full stack (FastAPI + PostgreSQL + React/Vite + Tailwind), JWT auth restricted to `@cybrella.io`, holiday management, monthly approval lock, Excel export, and Railway deployment.

The build is delivered in sequential phases (one feature branch per phase, PR into `main`). This plan file is the contract — code is generated phase-by-phase, not all at once.

---

## 1. High-Level Architecture

```
┌──────────────────────┐        ┌──────────────────────────┐        ┌────────────────┐
│  React + Vite SPA    │  HTTPS │  FastAPI (Python 3.12)   │   SQL  │  PostgreSQL    │
│  Tailwind, Axios,    │ ─────► │  JWT auth, RBAC,         │ ─────► │  (Railway)     │
│  React Router        │        │  SQLAlchemy 2.x + Alembic│        │                │
└──────────────────────┘        └──────────────────────────┘        └────────────────┘
                                          │
                                          ▼
                                  Resend API (reset emails)
```

- **Frontend** deployed on **Vercel** — talks to backend via `VITE_API_URL`.
- **Backend** is stateless on Railway; JWT in `Authorization: Bearer` header. Short-lived access token (60 min) + re-login on expiry (no refresh tokens needed at this scale).
- **Database** managed via Alembic migrations.
- **Email** via **Resend** (transactional API; SDK `resend` for Python).
- **No real-time tracking.** This is a *reporting* system: users manually enter check-in/check-out times after the fact. There are NO "Check in now" / "Check out now" buttons. `total_hours` is derived as `check_out - check_in`.

### Design system

Frontend uses the `design-taste-frontend` skill with: `DESIGN_VARIANCE: 6`, `MOTION_INTENSITY: 4`, `VISUAL_DENSITY: 5`. Mobile-first. Calendar collapses to tap-friendly grid on small screens. Day reporting uses a bottom-sheet modal on mobile, centered modal on desktop.

---

## 2. Database Schema (PostgreSQL)

All tables: `id BIGSERIAL PRIMARY KEY`, `created_at TIMESTAMPTZ DEFAULT now()`, `updated_at TIMESTAMPTZ`. Soft delete via `is_active`.

### `users`
| Column | Type | Notes |
|---|---|---|
| id | bigserial PK | |
| email | citext UNIQUE NOT NULL | must end `@cybrella.io` (CHECK constraint + app validation) |
| password_hash | text NOT NULL | bcrypt via passlib |
| full_name | text NOT NULL | |
| phone | text | |
| job_title | text | |
| department | text | |
| employment_type | text NOT NULL | `full_time` / `part_time` / `hourly` |
| role | text NOT NULL DEFAULT 'user' | `user` / `admin` |
| is_active | boolean NOT NULL DEFAULT true | soft delete |

Indexes: `(email)`, `(department)`, `(is_active)`.

### `attendance_records`
| Column | Type | Notes |
|---|---|---|
| user_id | bigint FK users(id) ON DELETE CASCADE | |
| date | date NOT NULL | ISO 8601 (e.g. `2026-04-15`) |
| check_in | time | nullable for non-work days |
| check_out | time | nullable |
| day_type | text NOT NULL | `work` / `vacation` / `sick` / `reserve` / `holiday` / `other_absence` |
| note | text | |
| status | text NOT NULL DEFAULT 'draft' | `draft` / `submitted` / `approved` / `rejected` |

Constraints: `UNIQUE (user_id, date)`. Indexes: `(user_id, date)`, `(date)`, `(status)`.

### `monthly_attendance_approvals`
| Column | Type | Notes |
|---|---|---|
| user_id | bigint FK users(id) | |
| month | date NOT NULL | day=01 (e.g. `2026-04-01`) |
| status | text NOT NULL | `submitted` / `approved` / `rejected` |
| approved_by | bigint FK users(id) | nullable |
| approved_at | timestamptz | |
| reject_reason | text | |
| locked | boolean NOT NULL DEFAULT false | true on approve; admin can unlock |

`UNIQUE (user_id, month)`.

### `organization_holidays`
| Column | Type | Notes |
|---|---|---|
| date | date NOT NULL UNIQUE | |
| title | text NOT NULL | |
| description | text | |

### `password_reset_tokens`
| Column | Type | Notes |
|---|---|---|
| user_id | bigint FK users(id) ON DELETE CASCADE | |
| token_hash | text NOT NULL UNIQUE | SHA-256 of raw token |
| expires_at | timestamptz NOT NULL | 60 min TTL |
| used_at | timestamptz | null until consumed |

---

## 3. Backend Structure

```
backend/
├── app/
│   ├── main.py                # FastAPI app, CORS, router includes
│   ├── database.py            # SQLAlchemy engine, SessionLocal, get_db
│   ├── core/
│   │   ├── config.py          # Pydantic Settings, env vars
│   │   ├── security.py        # password hashing, JWT encode/decode
│   │   └── deps.py            # get_current_user, require_admin
│   ├── models/                # user, attendance, approval, holiday, reset_token
│   ├── schemas/               # Pydantic v2 request/response
│   ├── routes/                # auth, users, attendance, admin, holidays
│   ├── services/              # auth_service, attendance_service, approval_service, export_service, holiday_service
│   └── utils/email.py         # Resend client wrapper (sends via verified cybrella.io domain)
├── alembic/                   # migrations
├── alembic.ini
├── tests/                     # pytest + httpx
├── requirements.txt
├── Dockerfile
└── railway.toml
```

Libraries: `fastapi`, `uvicorn[standard]`, `sqlalchemy>=2`, `psycopg[binary]`, `alembic`, `pydantic-settings`, `passlib[bcrypt]`, `python-jose[cryptography]`, `resend` (email), `openpyxl`, `email-validator`, `httpx` (tests).

### Permissions
- `get_current_user`: decodes JWT, loads user, rejects if `is_active=false`.
- `require_admin`: depends on `get_current_user`, asserts `role=='admin'`.
- Lock check: regular user PUT/POST/DELETE on attendance returns 403 if month is approved+locked.

### Routes (matches user spec exactly)

**Auth**: `POST /auth/register`, `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/me`.
**User**: `GET /users/me`, `PUT /users/me`, `PUT /users/me/change-password`.
**Attendance**: `GET /attendance/my?month=YYYY-MM`, `POST /attendance`, `PUT /attendance/{id}`, `DELETE /attendance/{id}`, `POST /attendance/month/{month}/submit`.
**Admin**: `GET /admin/users`, `GET /admin/users/{id}`, `PUT /admin/users/{id}`, `DELETE /admin/users/{id}` (deactivates), `GET /admin/attendance?user_id&month&department&status`, `PUT /admin/attendance/{id}`, `POST /admin/attendance/month/{user_id}/{month}/approve|reject|unlock`, `GET /admin/attendance/export?month=YYYY-MM`.
**Holidays**: `GET /holidays?month=YYYY-MM` (authed users), `POST|PUT|DELETE /admin/holidays[/{id}]`.

---

## 4. Frontend Structure

```
frontend/
├── src/
│   ├── main.tsx, App.tsx
│   ├── api/                   # client.ts (axios + auth interceptor), auth.ts, attendance.ts, admin.ts, holidays.ts
│   ├── auth/                  # AuthContext, ProtectedRoute
│   ├── components/
│   │   ├── ui/                # Button, Input, Modal, BottomSheet, Toast
│   │   ├── calendar/          # MonthCalendar, DayCell, MonthSummary
│   │   └── layout/            # UserLayout, AdminLayout, Navbar
│   ├── pages/
│   │   ├── public/            # Login, Register, ForgotPassword, ResetPassword
│   │   ├── user/              # Dashboard, Profile, ChangePassword
│   │   └── admin/             # Dashboard, Users, UserAttendance, Holidays
│   ├── hooks/                 # useAuth, useMonth, useToast
│   └── styles/tailwind.css
├── tailwind.config.js
├── vite.config.ts
└── .env.example
```

Routing (React Router v6):
- Public: `/login`, `/register`, `/forgot-password`, `/reset-password/:token`
- User: `/` (dashboard), `/profile`, `/profile/password`
- Admin: `/admin`, `/admin/users`, `/admin/users/:id`, `/admin/users/:id/attendance`, `/admin/holidays`

State: `AuthContext` for current user/JWT (localStorage). Plain Axios + local component state for server data at this scale; introduce TanStack Query only if it removes duplication.

### Key UX
- Calendar 6×7 grid, day-type pill + hours per cell. Holiday cells distinct. Approved months show lock icon and disable editing.
- Day report modal (bottom sheet `<sm`): day-type select, time pickers (only if `work`), note, save/cancel.
- Monthly summary: work / absence / vacation / sick / reserve days, total reported hours.
- Submit-month button bulk-flips drafts → submitted, upserts approval row.
- Admin export streams `.xlsx` (openpyxl) and triggers download.

---

## 5. Authentication Flow

1. **Register**: regex `^[^@]+@cybrella\.io$` (FE+BE+DB). Bcrypt hash. Admins are NOT self-registered; first admin via `INITIAL_ADMIN_EMAIL` env-driven seed.
2. **Login**: returns `{ access_token, token_type, user }`. JWT payload `{ sub: user_id, role, exp }`.
3. **Forgot password**: 32-byte token; store SHA-256 hash; 60-min TTL; email link `${FRONTEND_URL}/reset-password/{raw_token}`. Always return 200 (don't leak existence).
4. **Reset password**: validate token_hash, unexpired, unused → update password → mark `used_at`.
5. **Change password**: requires current-password verification.

---

## 6. Approval & Lock Logic

- User submits month → records flip `draft`→`submitted`; upsert approval row (status=`submitted`).
- Admin approves → approval `status=approved, locked=true`; bulk-update records → `approved`. User write-ops 403 on that month.
- Admin reject → approval `status=rejected`; records revert to `draft`; locked=false; reason stored (email optional).
- Admin unlock → `locked=false`, records → `draft`; user can edit again.

---

## 7. Build Phases (one branch per phase)

| # | Branch | Deliverable |
|---|---|---|
| 1 | `chore/scaffold` | **(STARTING NOW)** Monorepo skeleton: `backend/`, `frontend/`, root `README.md`, root `.gitignore`, `backend/.env.example`, `frontend/.env.example`, `docs/architecture.md` (this plan), MIT `LICENSE`, GitHub init + `main` branch + `chore/scaffold` branch. |
| 2 | `feat/db-schema` | SQLAlchemy models + initial Alembic migration; docker-compose for local Postgres. |
| 3 | `feat/backend-setup` | FastAPI app, config, db session, healthcheck, CORS, error handlers. |
| 4 | `feat/auth` | Register (domain-restricted), login, JWT, forgot/reset, `/auth/me`, change password. Tests. |
| 5 | `feat/attendance` | User attendance CRUD, monthly fetch, monthly submit, lock check. |
| 6 | `feat/admin` | Admin user mgmt, attendance filter/edit, approve/reject/unlock, Excel export. |
| 7 | `feat/holidays` | Holiday CRUD (admin) + public list. |
| 8 | `feat/frontend-setup` | Vite + Tailwind + Router + Axios + AuthContext + public auth pages (apply `design-taste-frontend`). |
| 9 | `feat/user-dashboard` | Calendar, day modal, profile, change password, monthly summary, submit month. |
| 10 | `feat/admin-dashboard` | Admin users page, user attendance details, monthly approval, holidays page, export button. |
| 11 | `chore/railway-deploy` | `railway.toml`, Dockerfiles, env wiring, deploy guide. |

Each phase ends with: tests pass → push branch → open PR (What / Files / How to test / Notes) → merge after review.

---

## 8. Environment Variables

Backend `.env` (Railway):
```
DATABASE_URL=postgresql+psycopg://user:pass@host:5432/cybrella_time
JWT_SECRET_KEY=<openssl rand -hex 32>
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
PASSWORD_RESET_EXPIRE_MINUTES=60
FRONTEND_URL=https://cybrella-time.vercel.app
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@cybrella.io
ALLOWED_EMAIL_DOMAIN=cybrella.io
INITIAL_ADMIN_EMAIL=lianc@cybrella.io
DEFAULT_TIMEZONE=Asia/Jerusalem
```

> **Resend domain note**: `noreply@cybrella.io` does not need a real inbox; the `cybrella.io` domain must be verified in Resend via DNS (SPF, DKIM, DMARC records) before emails will deliver.

Frontend `.env` (Vercel):
```
VITE_API_URL=https://cybrella-time-api.up.railway.app
```

---

## 9. Deployment (Railway backend + DB, Vercel frontend)

- **Railway Postgres plugin** → provides `DATABASE_URL`.
- **Railway backend service** (Python). `railway.toml` start cmd: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Migrations run on every deploy.
- **Vercel frontend** — connected to GitHub repo (`frontend/` as root). Build cmd: `npm run build`, output `dist/`. Set `VITE_API_URL` in Vercel env.
- Backend CORS allow-lists `FRONTEND_URL` (Vercel production URL + preview URLs via regex).
- **Resend**: verify the `cybrella.io` sending domain (DNS records) before going live.
- **Initial admin**: on first registration, if email matches `INITIAL_ADMIN_EMAIL`, role auto-set to `admin`.

---

## 10. Verification

Per phase:
- `pytest -q` (backend).
- `npm run build && npm run typecheck` (frontend, Phase 8+).
- Smoke via Swagger `/docs` and click-through.

End-to-end:
1. Register `alice@cybrella.io` ✓; reject `alice@gmail.com` ✗.
2. Promote one user to admin via seed.
3. As user: report 5 days, submit month.
4. As admin: filter, edit, approve → user can no longer edit.
5. Admin unlock → user re-edits → resubmit → re-approve.
6. Holiday on the 15th appears on calendar.
7. Forgot password → email → reset → login.
8. Admin export → `.xlsx` downloads.
9. Mobile (375px): calendar usable, bottom-sheet modal works, buttons ≥44px.

---

## 11. Critical Files

Backend: `app/main.py`, `app/database.py`, `app/core/{config,security,deps}.py`, `app/models/*.py`, `app/schemas/*.py`, `app/routes/{auth,users,attendance,admin,holidays}.py`, `app/services/*.py`, `app/utils/email.py`, `alembic/versions/*.py`.

Frontend: `src/App.tsx`, `src/api/client.ts`, `src/auth/AuthContext.tsx`, `src/components/calendar/MonthCalendar.tsx`, `src/components/ui/Modal.tsx`, `src/pages/user/Dashboard.tsx`, `src/pages/admin/Dashboard.tsx`, `tailwind.config.js`.

Infra: `Dockerfile`, `railway.toml`, `docker-compose.yml`, `README.md`.

---

## 12. Resolved Decisions

1. **Hours model**: `total_hours = check_out - check_in`, derived. No real-time tracking; users manually enter times after the fact. Editable freely (subject to month-lock).
2. **Email provider**: **Resend** (Python SDK).
3. **Initial admin**: `INITIAL_ADMIN_EMAIL` env — auto-promote on first registration matching that email.
4. **Frontend hosting**: **Vercel**.
5. **Timezone**: `DEFAULT_TIMEZONE=Asia/Jerusalem`. All `created_at`/`updated_at`/`approved_at` stored as `TIMESTAMPTZ` (UTC) and converted to Asia/Jerusalem at the API boundary or in the frontend (Intl). Attendance `date` and `check_in`/`check_out` are stored as plain `date`/`time` and interpreted in the org's default timezone — no per-user timezone for v1. The backend uses `zoneinfo.ZoneInfo(settings.DEFAULT_TIMEZONE)` for any "today"/month-boundary calculations.
