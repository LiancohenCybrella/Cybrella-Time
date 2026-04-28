import { ReactNode } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  function onLogout() {
    logout();
    navigate("/login", { replace: true });
  }
  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-ink-900 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/admin" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent-500 text-ink-900">
              C
            </span>
            <span>Cybrella Time · Admin</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <NavLink
              to="/admin"
              end
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 ${
                  isActive ? "bg-white text-ink-900" : "text-white/80 hover:bg-white/10"
                }`
              }
            >
              Overview
            </NavLink>
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 ${
                  isActive ? "bg-white text-ink-900" : "text-white/80 hover:bg-white/10"
                }`
              }
            >
              Users
            </NavLink>
            <NavLink
              to="/admin/holidays"
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 ${
                  isActive ? "bg-white text-ink-900" : "text-white/80 hover:bg-white/10"
                }`
              }
            >
              Holidays
            </NavLink>
            <Link to="/" className="rounded-lg px-3 py-1.5 text-white/80 hover:bg-white/10">
              My calendar
            </Link>
            <button
              onClick={onLogout}
              className="rounded-lg px-3 py-1.5 text-white/80 hover:bg-white/10"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
