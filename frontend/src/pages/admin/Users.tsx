import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as adminApi from "../../api/admin";
import { apiError } from "../../api/client";
import type { User } from "../../api/auth";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";

const FILTER_HE: Record<string, string> = {
  all: "הכל",
  active: "פעילים",
  inactive: "לא פעילים",
};

const ROLE_HE: Record<string, string> = { admin: "מנהל", user: "משתמש" };

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [error, setError] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<adminApi.AdminPasswordReset | null>(
    null
  );
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function load() {
    setError(null);
    try {
      const params: { is_active?: boolean } = {};
      if (filter === "active") params.is_active = true;
      if (filter === "inactive") params.is_active = false;
      setUsers(await adminApi.listUsers(params));
    } catch (err) {
      setError(apiError(err));
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function deactivate(id: number) {
    if (!confirm("להשבית את המשתמש?")) return;
    await adminApi.deactivateUser(id);
    await load();
  }

  async function reactivate(id: number) {
    await adminApi.updateUser(id, { is_active: true });
    await load();
  }

  async function onResetPassword(u: User) {
    if (
      !confirm(
        `לאפס את הסיסמה של ${u.full_name}? תיווצר סיסמה זמנית והמשתמש יחויב להחליף בכניסה הבאה.`
      )
    )
      return;
    setResetting(true);
    setError(null);
    try {
      const res = await adminApi.resetUserPassword(u.id);
      setResetResult(res);
      setCopied(false);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setResetting(false);
    }
  }

  async function copyTemp() {
    if (!resetResult) return;
    try {
      await navigator.clipboard.writeText(resetResult.temp_password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">משתמשים</h1>
        <div className="inline-flex rounded-xl border border-ink-200 bg-white p-1 text-sm">
          {(["all", "active", "inactive"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`rounded-lg px-3 py-1.5 ${
                filter === v ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-ink-100"
              }`}
            >
              {FILTER_HE[v]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-right text-xs uppercase tracking-wider text-ink-500">
              <th className="py-2 pr-3">שם</th>
              <th className="py-2 pr-3">אימייל</th>
              <th className="py-2 pr-3">מחלקה</th>
              <th className="py-2 pr-3">תפקיד</th>
              <th className="py-2 pr-3">סטטוס</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-ink-50">
                <td className="py-2 pr-3 font-medium">{u.full_name}</td>
                <td className="py-2 pr-3 text-ink-600">{u.email}</td>
                <td className="py-2 pr-3 text-ink-600">{u.department || "—"}</td>
                <td className="py-2 pr-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      u.role === "admin"
                        ? "bg-accent-500/15 text-accent-600"
                        : "bg-ink-100 text-ink-700"
                    }`}
                  >
                    {ROLE_HE[u.role] ?? u.role}
                  </span>
                </td>
                <td className="py-2 pr-3 text-xs">
                  {u.is_active ? (
                    <span className="text-emerald-600">פעיל</span>
                  ) : (
                    <span className="text-rose-600">לא פעיל</span>
                  )}
                </td>
                <td className="py-2 pr-3 text-left">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      to={`/admin/users/${u.id}/attendance`}
                      className="rounded-lg border border-ink-200 px-2 py-1 text-xs hover:bg-ink-50"
                    >
                      נוכחות
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={() => onResetPassword(u)}
                      loading={resetting}
                    >
                      אפס סיסמה
                    </Button>
                    {u.is_active ? (
                      <Button variant="ghost" onClick={() => deactivate(u.id)}>
                        השבת
                      </Button>
                    ) : (
                      <Button variant="ghost" onClick={() => reactivate(u.id)}>
                        הפעל מחדש
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-ink-500">
                  לא נמצאו משתמשים.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={resetResult !== null}
        onClose={() => setResetResult(null)}
        title="סיסמה זמנית נוצרה"
      >
        {resetResult && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-ink-700">
              העבר את הסיסמה הבאה אל <strong>{resetResult.email}</strong>. בכניסה
              הבאה הוא יחויב להחליף סיסמה.
            </p>
            <div className="flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50 p-3">
              <code className="flex-1 select-all font-mono text-base text-ink-900">
                {resetResult.temp_password}
              </code>
              <Button variant="ghost" type="button" onClick={copyTemp}>
                {copied ? "הועתק ✓" : "העתק"}
              </Button>
            </div>
            <p className="text-xs text-ink-500">
              הסיסמה לא תוצג שוב. אם איבדת אותה — אפס שוב.
            </p>
            <div className="flex justify-end">
              <Button type="button" onClick={() => setResetResult(null)}>
                סיימתי
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
