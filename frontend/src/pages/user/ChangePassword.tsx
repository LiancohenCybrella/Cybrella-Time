import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../../api/auth";
import { apiError } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { UserLayout } from "../../components/layout/UserLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const forced = !!user?.must_change_password;
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (next !== confirm) {
      setError("הסיסמאות אינן תואמות");
      return;
    }
    setSaving(true);
    try {
      await changePassword(current, next);
      await refresh();
      navigate(forced ? "/" : "/profile", { replace: true });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <UserLayout>
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">שינוי סיסמה</h1>
      {forced && (
        <div className="mb-4 max-w-md rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          קיבלת סיסמה זמנית מהמנהל. יש להחליף סיסמה לפני המשך השימוש.
        </div>
      )}
      <form onSubmit={onSubmit} className="card flex max-w-md flex-col gap-4">
        <Input
          label="סיסמה נוכחית"
          type="password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />
        <Input
          label="סיסמה חדשה"
          type="password"
          required
          minLength={8}
          value={next}
          onChange={(e) => setNext(e.target.value)}
        />
        <Input
          label="אימות סיסמה חדשה"
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            עדכן סיסמה
          </Button>
        </div>
      </form>
    </UserLayout>
  );
}
