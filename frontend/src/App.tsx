import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import ForgotPassword from "./pages/public/ForgotPassword";
import ResetPassword from "./pages/public/ResetPassword";

// Phase 9 placeholders for user pages
function UserHomePlaceholder() {
  return (
    <div className="grid min-h-screen place-items-center text-ink-600">
      <p>User dashboard — coming in Phase 9.</p>
    </div>
  );
}

function AdminHomePlaceholder() {
  return (
    <div className="grid min-h-screen place-items-center text-ink-600">
      <p>Admin dashboard — coming in Phase 10.</p>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <UserHomePlaceholder />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminHomePlaceholder />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
