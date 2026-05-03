import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { AuthShell } from "../../components/layout/AuthShell";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { apiError } from "../../api/client";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const u = await login(email, password);
      navigate(u.role === "admin" ? "/admin" : "/", { replace: true });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Sign in" subtitle="Use your work email.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <Button type="submit" loading={loading}>
          Sign in
        </Button>
        <div className="flex items-center justify-between text-xs text-ink-600">
          <Link to="/forgot-password" className="hover:text-brand-600">
            Forgot password?
          </Link>
          <Link to="/register" className="hover:text-brand-600">
            Create account
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
