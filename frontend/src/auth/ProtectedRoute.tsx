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
        <div className="animate-pulse">טוען…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" replace />;

  // Force password change before allowing anything else
  if (
    user.must_change_password &&
    location.pathname !== "/profile/password"
  ) {
    return <Navigate to="/profile/password" replace />;
  }

  return <>{children}</>;
}
