# Cybrella Time — Deployment Guide

## Stack
- **Backend:** Railway (Postgres plugin + Python service via Dockerfile)
- **Frontend:** Vercel (root: `frontend/`)
- **Email:** Resend (verified `cybrella.io` sending domain)

---

## 1. Database — Railway Postgres plugin

1. New Project → **Provision Postgres**.
2. Copy `DATABASE_URL` from the plugin's *Variables* tab. Railway returns it in `postgres://` form — convert the scheme to `postgresql+psycopg://` for SQLAlchemy:
   ```
   postgresql+psycopg://USER:PASS@HOST:PORT/DBNAME
   ```

## 2. Backend — Railway service

1. *New Service* → *Deploy from GitHub* → pick the `Cybrella-Time` repo, root: `backend/`.
2. Railway detects `backend/Dockerfile` and `backend/railway.toml` automatically.
3. Set environment variables (Settings → Variables):

   | Var | Value |
   |---|---|
   | `DATABASE_URL` | from the Postgres plugin (with `postgresql+psycopg://`) |
   | `JWT_SECRET_KEY` | `openssl rand -hex 32` output |
   | `JWT_ALGORITHM` | `HS256` |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` |
   | `PASSWORD_RESET_EXPIRE_MINUTES` | `60` |
   | `FRONTEND_URL` | Vercel production URL (e.g. `https://cybrella-time.vercel.app`) |
   | `RESEND_API_KEY` | `re_…` |
   | `EMAIL_FROM` | `noreply@cybrella.io` |
   | `ALLOWED_EMAIL_DOMAIN` | `cybrella.io` |
   | `INITIAL_ADMIN_EMAIL` | `lianc@cybrella.io` |
   | `DEFAULT_TIMEZONE` | `Asia/Jerusalem` |

4. The Dockerfile runs `alembic upgrade head` on every deploy before starting Uvicorn — no manual migrations.
5. Healthcheck: `GET /health` returns `{"status":"ok"}`.
6. Note the public domain Railway assigns (e.g. `https://cybrella-time-api.up.railway.app`).

## 3. Frontend — Vercel

1. *New Project* → *Import Git Repository* → pick `Cybrella-Time`. Set **Root Directory** to `frontend/`.
2. Framework preset: **Vite**. Build command: `npm run build`. Output dir: `dist`.
3. Environment variable (Production + Preview):
   - `VITE_API_URL` = the Railway backend URL (no trailing slash).
4. Deploy. The first commit on `main` will trigger a Production build; subsequent branch pushes get Preview URLs.

## 4. Resend domain verification

1. Resend → *Domains* → *Add Domain* → `cybrella.io`.
2. Add the SPF, DKIM, and DMARC records Resend prints to the `cybrella.io` DNS zone.
3. Wait for *Verified* status. Until verified, password-reset emails will fail; the backend logs the reset URL instead so dev/QA still works.

## 5. Initial admin

The first user that registers with `INITIAL_ADMIN_EMAIL` (`lianc@cybrella.io`) is auto-promoted to `admin`.

## 6. Smoke test

1. `curl https://<railway-domain>/health` → `{"status":"ok"}`.
2. Open the Vercel URL → register `lianc@cybrella.io` → confirm role is `admin` in `/auth/me`.
3. Register a second `@cybrella.io` user → report 5 days → submit month.
4. Sign in as admin → approve the month → confirm the user can no longer edit.
5. Admin → Export → `.xlsx` downloads.

## Troubleshooting

- **CORS errors**: verify `FRONTEND_URL` matches the Vercel URL exactly (or rely on the `cybrella-time-*.vercel.app` preview regex baked into `app/main.py`).
- **Migrations not applied**: Railway deploy logs run `alembic upgrade head` first; check for connection errors before the `uvicorn` line.
- **Reset emails not sending**: confirm `cybrella.io` is *Verified* in Resend, then re-deploy so the API key is picked up.
