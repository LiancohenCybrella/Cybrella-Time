import type { DayType } from "../../api/attendance";

export const DAY_TYPE_META: Record<
  DayType,
  { label: string; pill: string; dot: string }
> = {
  work: {
    label: "עבודה",
    pill: "bg-brand-50 text-brand-700 border-brand-100",
    dot: "bg-brand-500",
  },
  vacation: {
    label: "חופשה",
    pill: "bg-amber-50 text-amber-800 border-amber-100",
    dot: "bg-amber-500",
  },
  sick: {
    label: "מחלה",
    pill: "bg-rose-50 text-rose-700 border-rose-100",
    dot: "bg-rose-500",
  },
  reserve: {
    label: "מילואים",
    pill: "bg-purple-50 text-purple-700 border-purple-100",
    dot: "bg-purple-500",
  },
  holiday: {
    label: "חג",
    pill: "bg-accent-500/15 text-accent-600 border-accent-500/30",
    dot: "bg-accent-500",
  },
  other_absence: {
    label: "היעדרות אחרת",
    pill: "bg-ink-100 text-ink-700 border-ink-200",
    dot: "bg-ink-400",
  },
  full_day_activity: {
    label: "פעילות יום מלא",
    pill: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dot: "bg-emerald-500",
  },
};

export const DAY_TYPE_OPTIONS: { value: DayType; label: string }[] = [
  { value: "work", label: "יום עבודה" },
  { value: "vacation", label: "חופשה" },
  { value: "sick", label: "מחלה" },
  { value: "reserve", label: "מילואים" },
  { value: "holiday", label: "חג" },
  { value: "other_absence", label: "היעדרות אחרת" },
  { value: "full_day_activity", label: "פעילות יום מלא" },
];
