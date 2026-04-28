import type { AttendanceRecord } from "../../api/attendance";
import type { Holiday } from "../../api/holidays";
import { DAY_TYPE_META } from "./dayTypeMeta";
import { monthDays } from "../../hooks/useMonth";

type Props = {
  month: string;
  records: AttendanceRecord[];
  holidays: Holiday[];
  locked: boolean;
  onPickDay: (isoDate: string) => void;
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthCalendar({ month, records, holidays, locked, onPickDay }: Props) {
  const days = monthDays(month);
  const firstDow = days[0].getDay();
  const padding = Array.from({ length: firstDow }, () => null);

  const recordByDate = new Map(records.map((r) => [r.date, r]));
  const holidayByDate = new Map(holidays.map((h) => [h.date, h]));

  return (
    <div>
      <div className="mb-2 hidden grid-cols-7 gap-2 text-center text-xs font-medium uppercase tracking-wider text-ink-500 sm:grid">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-7">
        {padding.map((_, i) => (
          <div key={`pad-${i}`} className="hidden sm:block" />
        ))}
        {days.map((d) => {
          const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate()
          ).padStart(2, "0")}`;
          const rec = recordByDate.get(iso);
          const holiday = holidayByDate.get(iso);
          const meta = rec ? DAY_TYPE_META[rec.day_type] : null;
          const isWeekend = d.getDay() === 5 || d.getDay() === 6;
          const isToday = iso === new Date().toISOString().slice(0, 10);

          return (
            <button
              key={iso}
              type="button"
              onClick={() => onPickDay(iso)}
              disabled={locked}
              className={`group relative flex min-h-[88px] flex-col rounded-2xl border p-2.5 text-left transition ${
                rec
                  ? "border-ink-200 bg-white"
                  : holiday
                  ? "border-accent-500/30 bg-accent-500/5"
                  : "border-ink-100 bg-white/60 hover:border-brand-300 hover:bg-white"
              } ${locked ? "cursor-not-allowed opacity-70" : "cursor-pointer"} ${
                isToday ? "ring-2 ring-brand-400" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold ${
                    isWeekend ? "text-rose-500" : "text-ink-700"
                  }`}
                >
                  {d.getDate()}
                </span>
                {rec?.status === "approved" && (
                  <span className="text-[10px] uppercase tracking-wider text-accent-600">
                    ✓ approved
                  </span>
                )}
                {rec?.status === "submitted" && (
                  <span className="text-[10px] uppercase tracking-wider text-brand-600">
                    submitted
                  </span>
                )}
              </div>
              {holiday && (
                <span className="mt-1 truncate text-[11px] font-medium text-accent-600">
                  {holiday.title}
                </span>
              )}
              {rec && meta && (
                <span
                  className={`mt-2 inline-flex items-center gap-1.5 self-start rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.pill}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </span>
              )}
              {rec?.total_hours != null && (
                <span className="mt-auto pt-1 text-xs text-ink-500">
                  {rec.total_hours.toFixed(2)} h
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
