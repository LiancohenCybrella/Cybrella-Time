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
      <AuthShell title="בדוק את תיבת הדואר">
        <p className="text-sm text-ink-700">
          אם קיים חשבון עבור <strong>{email}</strong>, נשלח קישור לאיפוס. הקישור תקף ל-60 דקות.
        </p>
        <div className="mt-4">
          <Link to="/login" className="text-sm text-brand-600 hover:underline">
            חזרה להתחברות
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="איפוס סיסמה" subtitle="נשלח לך קישור לאיפוס במייל.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          label="אימייל"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <Button type="submit" loading={loading}>
          שלח קישור איפוס
        </Button>
        <p className="text-center text-xs text-ink-600">
          <Link to="/login" className="hover:text-brand-600">
            חזרה להתחברות
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
