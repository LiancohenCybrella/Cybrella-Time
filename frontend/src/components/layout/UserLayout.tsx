import { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export function UserLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ink-50 via-brand-50/40 to-white">
      <header className="sticky top-0 z-30 border-b border-ink-100/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-white">
              C
            </span>
            <span>Cybrella Time</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 ${
                  isActive ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-ink-100"
                }`
              }
            >
              לוח שנה
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 ${
                  isActive ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-ink-100"
                }`
              }
            >
              פרופיל
            </NavLink>
            {user?.role === "admin" && (
              <NavLink
                to="/admin"
                className="rounded-lg bg-accent-500/20 px-3 py-1.5 text-accent-600 hover:bg-accent-500/30"
              >
                ניהול
              </NavLink>
            )}
            <button
              onClick={onLogout}
              className="rounded-lg px-3 py-1.5 text-ink-600 hover:bg-ink-100"
            >
              יציאה
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
