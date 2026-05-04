import { useState } from "react";

export function useMonth(initial?: string) {
  const today = new Date();
  const [month, setMonth] = useState<string>(
    initial ?? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  );

  function shift(delta: number) {
    const [yStr, mStr] = month.split("-");
    const y = Number(yStr);
    const m = Number(mStr);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  return { month, setMonth, shift };
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("he-IL", { month: "long", year: "numeric" });
}

export function monthDays(month: string): Date[] {
  const [y, m] = month.split("-").map(Number);
  const days: Date[] = [];
  const last = new Date(y, m, 0).getDate();
  for (let d = 1; d <= last; d++) days.push(new Date(y, m - 1, d));
  return days;
}
