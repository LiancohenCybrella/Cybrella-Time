import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "./AuthContext";

type Props = { children: ReactNode; adminOnly?: boolean };

export function ProtectedRoute({ children, adminOnly }: Props) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-ink-600">
        <div className="animate-pulse">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;

  return <>{children}</>;
}
