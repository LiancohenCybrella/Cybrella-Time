import { useCallback, useEffect, useState } from "react";
import * as attendanceApi from "../../api/attendance";
import * as holidaysApi from "../../api/holidays";
import { apiError } from "../../api/client";
import { DayModal } from "../../components/calendar/DayModal";
import { MonthCalendar } from "../../components/calendar/MonthCalendar";
import { MonthSummaryCard } from "../../components/calendar/MonthSummaryCard";
import { UserLayout } from "../../components/layout/UserLayout";
import { Button } from "../../components/ui/Button";
import { monthLabel, useMonth } from "../../hooks/useMonth";

export default function Dashboard() {
  const { month, shift } = useMonth();
  const [data, setData] = useState<attendanceApi.MonthAttendance | null>(null);
  const [holidays, setHolidays] = useState<holidaysApi.Holiday[]>([]);
  const [pickedDate, setPickedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, h] = await Promise.all([
        attendanceApi.getMyMonth(month),
        holidaysApi.listHolidays(month),
      ]);
      setData(m);
      setHolidays(h);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  const recordForDate = pickedDate
    ? data?.records.find((r) => r.date === pickedDate) ?? null
    : null;

  async function onSave(payload: {
    date: string;
    day_type: attendanceApi.DayType;
    check_in: string | null;
    check_out: string | null;
    note: string | null;
  }) {
    if (recordForDate) {
      await attendanceApi.updateRecord(recordForDate.id, payload);
    } else {
      await attendanceApi.createRecord(payload);
    }
    await load();
    setToast("Saved.");
    setTimeout(() => setToast(null), 1800);
  }

  async function onDelete() {
    if (!recordForDate) return;
    await attendanceApi.deleteRecord(recordForDate.id);
    await load();
    setToast("Deleted.");
    setTimeout(() => setToast(null), 1800);
  }

  async function onSubmitMonth() {
    setSubmitting(true);
    try {
      await attendanceApi.submitMonth(month);
      await load();
      setToast("Month submitted for review.");
      setTimeout(() => setToast(null), 2200);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  const locked = data?.summary.locked ?? false;
  const canSubmit =
    !locked && (data?.records.length ?? 0) > 0 && data?.approval_status !== "submitted";

  return (
    <UserLayout>
      <section className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => shift(-1)} aria-label="previous month">
            ←
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">{monthLabel(month)}</h1>
          <Button variant="ghost" onClick={() => shift(1)} aria-label="next month">
            →
          </Button>
        </div>
        <div className="flex gap-2">
          <Button onClick={onSubmitMonth} loading={submitting} disabled={!canSubmit}>
            Submit month
          </Button>
        </div>
      </section>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="mb-5">
            <MonthSummaryCard summary={data.summary} />
          </div>
          <div className="card">
            <MonthCalendar
              month={month}
              records={data.records}
              holidays={holidays}
              locked={locked}
              onPickDay={(iso) => setPickedDate(iso)}
            />
          </div>
        </>
      )}

      {loading && !data && (
        <div className="grid place-items-center py-12 text-ink-500">Loading…</div>
      )}

      <DayModal
        open={pickedDate !== null}
        date={pickedDate}
        record={recordForDate}
        locked={locked}
        onClose={() => setPickedDate(null)}
        onSave={onSave}
        onDelete={onDelete}
      />

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-ink-900 px-4 py-2 text-sm text-white shadow-glow animate-fade-up">
          {toast}
        </div>
      )}
    </UserLayout>
  );
}
