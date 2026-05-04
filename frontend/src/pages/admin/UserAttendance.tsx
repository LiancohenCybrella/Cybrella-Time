import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import * as adminApi from "../../api/admin";
import * as attendanceApi from "../../api/attendance";
import { apiError } from "../../api/client";
import type { User } from "../../api/auth";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Button } from "../../components/ui/Button";
import { DAY_TYPE_META } from "../../components/calendar/dayTypeMeta";
import { monthLabel, useMonth } from "../../hooks/useMonth";

const STATUS_HE: Record<string, string> = {
  draft: "טיוטה",
  submitted: "הוגש",
  approved: "אושר",
  rejected: "נדחה",
};

export default function UserAttendance() {
  const params = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const userId = Number(params.id);
  const initialMonth = searchParams.get("month") ?? undefined;
  const { month, shift } = useMonth(initialMonth);

  const [user, setUser] = useState<User | null>(null);
  const [records, setRecords] = useState<attendanceApi.AttendanceRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, recs] = await Promise.all([
        adminApi.getUser(userId),
        adminApi.listAttendance({ user_id: userId, month }),
      ]);
      setUser(u);
      setRecords(recs);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }, [userId, month]);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve() {
    setWorking(true);
    try {
      await adminApi.approveMonth(userId, month);
      await load();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setWorking(false);
    }
  }

  async function reject() {
    const reason = prompt("סיבת דחייה (אופציונלי)") ?? undefined;
    setWorking(true);
    try {
      await adminApi.rejectMonth(userId, month, reason);
      await load();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setWorking(false);
    }
  }

  async function unlock() {
    setWorking(true);
    try {
      await adminApi.unlockMonth(userId, month);
      await load();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setWorking(false);
    }
  }

  const totalHours = records.reduce((sum, r) => sum + (r.total_hours ?? 0), 0);
  const anyApproved = records.some((r) => r.status === "approved");

  return (
    <AdminLayout>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{user?.full_name ?? "…"}</h1>
          <p className="text-sm text-ink-600">
            {user?.email} · {user?.department || "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => shift(-1)}>
            ←
          </Button>
          <span className="font-medium">{monthLabel(month)}</span>
          <Button variant="ghost" onClick={() => shift(1)}>
            →
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button onClick={approve} loading={working} disabled={records.length === 0}>
          אשר חודש
        </Button>
        <Button variant="ghost" onClick={reject} loading={working}>
          דחה חודש
        </Button>
        {anyApproved && (
          <Button variant="ghost" onClick={unlock} loading={working}>
            בטל נעילת חודש
          </Button>
        )}
        <span className="ml-auto text-sm text-ink-600">
          {records.length} רשומות · {totalHours.toFixed(2)} ש׳
        </span>
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-right text-xs uppercase tracking-wider text-ink-500">
              <th className="py-2 pr-3">תאריך</th>
              <th className="py-2 pr-3">סוג</th>
              <th className="py-2 pr-3">כניסה</th>
              <th className="py-2 pr-3">יציאה</th>
              <th className="py-2 pr-3">שעות</th>
              <th className="py-2 pr-3">סטטוס</th>
              <th className="py-2 pr-3">הערה</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => {
              const meta = DAY_TYPE_META[r.day_type];
              return (
                <tr key={r.id} className="border-b border-ink-50 align-top">
                  <td className="py-2 pr-3 font-medium">{r.date}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs ${meta.pill}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                    {r.partial_secondary_type && (
                      <span
                        className={`mr-1 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs ${
                          DAY_TYPE_META[r.partial_secondary_type].pill
                        }`}
                        title="פעילות משנית"
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            DAY_TYPE_META[r.partial_secondary_type].dot
                          }`}
                        />
                        + {DAY_TYPE_META[r.partial_secondary_type].label}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-3 tabular-nums text-ink-700">{r.check_in ?? "—"}</td>
                  <td className="py-2 pr-3 tabular-nums text-ink-700">{r.check_out ?? "—"}</td>
                  <td className="py-2 pr-3 tabular-nums">
                    {r.total_hours?.toFixed(2) ?? "—"}
                  </td>
                  <td className="py-2 pr-3 text-xs text-ink-600">
                    {STATUS_HE[r.status] ?? r.status}
                  </td>
                  <td className="py-2 pr-3 max-w-[18rem] truncate text-ink-700">{r.note}</td>
                </tr>
              );
            })}
            {records.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-ink-500">
                  אין רשומות לחודש זה.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
