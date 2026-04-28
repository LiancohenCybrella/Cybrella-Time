import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as adminApi from "../../api/admin";
import { apiError } from "../../api/client";
import type { User } from "../../api/auth";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Button } from "../../components/ui/Button";

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [error, setError] = useState<string | null>(null);

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
    if (!confirm("Deactivate this user?")) return;
    await adminApi.deactivateUser(id);
    await load();
  }

  async function reactivate(id: number) {
    await adminApi.updateUser(id, { is_active: true });
    await load();
  }

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <div className="inline-flex rounded-xl border border-ink-200 bg-white p-1 text-sm">
          {(["all", "active", "inactive"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`rounded-lg px-3 py-1.5 capitalize ${
                filter === v ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-ink-100"
              }`}
            >
              {v}
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
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Email</th>
              <th className="py-2 pr-3">Dept</th>
              <th className="py-2 pr-3">Role</th>
              <th className="py-2 pr-3">Status</th>
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
                    {u.role}
                  </span>
                </td>
                <td className="py-2 pr-3 text-xs">
                  {u.is_active ? (
                    <span className="text-emerald-600">active</span>
                  ) : (
                    <span className="text-rose-600">inactive</span>
                  )}
                </td>
                <td className="py-2 pr-3 text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      to={`/admin/users/${u.id}/attendance`}
                      className="rounded-lg border border-ink-200 px-2 py-1 text-xs hover:bg-ink-50"
                    >
                      Attendance
                    </Link>
                    {u.is_active ? (
                      <Button variant="ghost" onClick={() => deactivate(u.id)}>
                        Deactivate
                      </Button>
                    ) : (
                      <Button variant="ghost" onClick={() => reactivate(u.id)}>
                        Reactivate
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="py-6 text-center text-ink-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
