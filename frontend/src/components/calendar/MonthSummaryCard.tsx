import type { MonthSummary } from "../../api/attendance";

export function MonthSummaryCard({ summary }: { summary: MonthSummary }) {
  const items: { label: string; value: number; tone: string }[] = [
    { label: "ימי עבודה", value: summary.work_days, tone: "text-brand-700" },
    { label: "חופשה", value: summary.vacation_days, tone: "text-amber-700" },
    { label: "מחלה", value: summary.sick_days, tone: "text-rose-700" },
    { label: "מילואים", value: summary.reserve_days, tone: "text-purple-700" },
    { label: "חג", value: summary.holiday_days, tone: "text-accent-600" },
    { label: "אחר", value: summary.other_absence_days, tone: "text-ink-700" },
  ];
  return (
    <div className="card">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-ink-500">סה״כ שעות</p>
          <p className="text-3xl font-semibold tracking-tight text-ink-900">
            {summary.total_hours.toFixed(2)}
            <span className="ml-1 text-base font-normal text-ink-500">ש׳</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs">
          {summary.locked && (
            <span className="rounded-full bg-accent-500/15 px-2.5 py-0.5 font-medium text-accent-600">
              ✓ אושר ונעול
            </span>
          )}
          {!summary.locked && summary.submitted && (
            <span className="rounded-full bg-brand-50 px-2.5 py-0.5 font-medium text-brand-700">
              הוגש — ממתין לאישור
            </span>
          )}
          {!summary.submitted && (
            <span className="rounded-full bg-ink-100 px-2.5 py-0.5 font-medium text-ink-700">
              טיוטה
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {items.map((it) => (
          <div key={it.label} className="rounded-xl border border-ink-100 p-3">
            <p className="text-[11px] uppercase tracking-wider text-ink-500">{it.label}</p>
            <p className={`text-xl font-semibold ${it.tone}`}>{it.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
