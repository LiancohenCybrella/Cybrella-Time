import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../../api/auth";
import { apiError } from "../../api/client";
import { AuthShell } from "../../components/layout/AuthShell";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email);
      setDone(true);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthShell title="Check your inbox">
        <p className="text-sm text-ink-700">
          If an account exists for <strong>{email}</strong>, a reset link has been sent. The link
          expires in 60 minutes.
        </p>
        <div className="mt-4">
          <Link to="/login" className="text-sm text-brand-600 hover:underline">
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Reset password" subtitle="We'll email you a reset link.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <Button type="submit" loading={loading}>
          Send reset link
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
