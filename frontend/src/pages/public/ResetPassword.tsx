import { FormEvent, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { resetPassword } from "../../api/auth";
import { apiError } from "../../api/client";
import { AuthShell } from "../../components/layout/AuthShell";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("missing token");
      return;
    }
    if (password !== confirm) {
      setError("passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Set new password">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          label="New password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="Confirm password"
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <Button type="submit" loading={loading}>
          Update password
        </Button>
        <p className="text-center text-xs text-ink-600">
          <Link to="/login" className="hover:text-brand-600">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
