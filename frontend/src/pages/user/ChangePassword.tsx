import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../../api/auth";
import { apiError } from "../../api/client";
import { UserLayout } from "../../components/layout/UserLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function ChangePassword() {
  const navigate = useNavigate();
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
      navigate("/profile", { replace: true });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <UserLayout>
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">שינוי סיסמה</h1>
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
