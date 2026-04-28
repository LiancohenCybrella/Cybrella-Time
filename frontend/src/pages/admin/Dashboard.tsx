import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as adminApi from "../../api/admin";
import { apiError } from "../../api/client";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Button } from "../../components/ui/Button";
import { monthLabel, useMonth } from "../../hooks/useMonth";
import type { User } from "../../api/auth";

export default function AdminDashboard() {
  const { month, shift } = useMonth();
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    adminApi
      .listUsers({ is_active: true })
      .then(setUsers)
      .catch((err) => setError(apiError(err)))
      .finally(() => setLoading(false));
  }, []);

  async function onExport() {
    setExporting(true);
    try {
      const blob = await adminApi.exportMonth(month);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cybrella-time-${month}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setExporting(false);
    }
  }

  return (
    <AdminLayout>
      <section className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => shift(-1)}>
            ←
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{monthLabel(month)}</h1>
          <Button variant="ghost" onClick={() => shift(1)}>
            →
          </Button>
        </div>
        <Button onClick={onExport} loading={exporting}>
          Export {month} (.xlsx)
        </Button>
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="card">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-ink-600">
          Active employees ({users.length})
        </h2>
        {loading && <p className="text-sm text-ink-500">Loading…</p>}
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((u) => (
            <Link
              key={u.id}
              to={`/admin/users/${u.id}/attendance?month=${month}`}
              className="group flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-3 transition hover:border-brand-300 hover:shadow"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-sm font-semibold text-brand-700">
                {u.full_name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{u.full_name}</p>
                <p className="truncate text-xs text-ink-500">
                  {u.department || "—"} · {u.email}
                </p>
              </div>
              <span className="ml-auto text-ink-400 group-hover:text-brand-500">→</span>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
