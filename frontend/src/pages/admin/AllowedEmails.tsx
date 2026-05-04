import { FormEvent, useEffect, useState } from "react";
import * as adminApi from "../../api/admin";
import type { AllowedEmail } from "../../api/admin";
import { apiError } from "../../api/client";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function AllowedEmails() {
  const [entries, setEntries] = useState<AllowedEmail[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<{
    email: string;
    default_role: "user" | "admin";
    note: string;
  }>({ email: "", default_role: "user", note: "" });
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setError(null);
    try {
      setEntries(await adminApi.listAllowedEmails());
    } catch (err) {
      setError(apiError(err));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await adminApi.addAllowedEmail({
        email: form.email,
        default_role: form.default_role,
        note: form.note || undefined,
      });
      setForm({ email: "", default_role: "user", note: "" });
      await load();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function onRemove(id: number) {
    if (!confirm("להסיר את המייל מרשימת המורשים?")) return;
    try {
      await adminApi.deleteAllowedEmail(id);
      await load();
    } catch (err) {
      setError(apiError(err));
    }
  }

  async function onChangeRole(id: number, role: "user" | "admin") {
    try {
      await adminApi.updateAllowedEmail(id, { default_role: role });
      await load();
    } catch (err) {
      setError(apiError(err));
    }
  }

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">מיילים מורשים</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form
        onSubmit={onAdd}
        className="card mb-6 grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_2fr_auto]"
      >
        <Input
          label="אימייל"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <div>
          <label className="label">תפקיד ברירת מחדל</label>
          <select
            className="input"
            value={form.default_role}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                default_role: e.target.value as "user" | "admin",
              }))
            }
          >
            <option value="user">משתמש</option>
            <option value="admin">מנהל</option>
          </select>
        </div>
        <Input
          label="הערה (אופציונלי)"
          value={form.note}
          onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
        />
        <div className="flex items-end">
          <Button type="submit" loading={submitting}>
            הוסף
          </Button>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-right text-xs uppercase tracking-wider text-ink-500">
              <th className="py-2 pr-3">אימייל</th>
              <th className="py-2 pr-3">תפקיד</th>
              <th className="py-2 pr-3">הערה</th>
              <th className="py-2 pr-3">נוסף</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-ink-50">
                <td className="py-2 pr-3 font-medium">{e.email}</td>
                <td className="py-2 pr-3">
                  <select
                    value={e.default_role}
                    onChange={(ev) =>
                      onChangeRole(e.id, ev.target.value as "user" | "admin")
                    }
                    className="rounded-lg border border-ink-200 px-2 py-1 text-xs"
                  >
                    <option value="user">משתמש</option>
                    <option value="admin">מנהל</option>
                  </select>
                </td>
                <td className="py-2 pr-3 text-ink-600">{e.note || "—"}</td>
                <td className="py-2 pr-3 text-ink-500 text-xs">
                  {new Date(e.created_at).toLocaleDateString("he-IL")}
                </td>
                <td className="py-2 pr-3 text-left">
                  <Button variant="ghost" onClick={() => onRemove(e.id)}>
                    הסר
                  </Button>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-ink-500">
                  אין עדיין מיילים מורשים. הוסף מייל למעלה כדי לאפשר הרשמה.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
