# Cybrella Time — Frontend

React + Vite + TypeScript SPA. See `../docs/architecture.md` for the full plan.

## Setup
```bash
npm install            # added in Phase 8
cp .env.example .env
npm run dev            # available Phase 8+
```

## Layout
```
src/
├── main.tsx, App.tsx
├── api/                axios client + endpoints
├── auth/               AuthContext, ProtectedRoute
├── components/
│   ├── ui/             Button, Input, Modal, BottomSheet, Toast
│   ├── calendar/       MonthCalendar, DayCell, MonthSummary
│   └── layout/         UserLayout, AdminLayout, Navbar
├── pages/
│   ├── public/         Login, Register, ForgotPassword, ResetPassword
│   ├── user/           Dashboard, Profile, ChangePassword
│   └── admin/          Dashboard, Users, UserAttendance, Holidays
├── hooks/              useAuth, useMonth, useToast
└── styles/tailwind.css
```

## Phase Status
This directory is scaffolded in Phase 1. Code lands Phase 8+.
