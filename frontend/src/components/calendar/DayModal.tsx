import { FormEvent, useEffect, useState } from "react";
import type { AttendanceRecord, DayType } from "../../api/attendance";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { DAY_TYPE_OPTIONS } from "./dayTypeMeta";

type Props = {
  open: boolean;
  date: string | null;
  record: AttendanceRecord | null;
  locked: boolean;
  onClose: () => void;
  onSave: (payload: {
    date: string;
    day_type: DayType;
    partial_secondary_type: DayType | null;
    check_in: string | null;
    check_out: string | null;
    note: string | null;
  }) => Promise<void>;
  onDelete: () => Promise<void>;
};

export function DayModal({ open, date, record, locked, onClose, onSave, onDelete }: Props) {
  const [dayType, setDayType] = useState<DayType>("work");
  const [hasSecondary, setHasSecondary] = useState(false);
  const [secondaryType, setSecondaryType] = useState<DayType>("work");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (record) {
      setDayType(record.day_type);
      setHasSecondary(record.partial_secondary_type !== null);
      setSecondaryType(record.partial_secondary_type ?? "work");
      setCheckIn(record.check_in?.slice(0, 5) ?? "");
      setCheckOut(record.check_out?.slice(0, 5) ?? "");
      setNote(record.note ?? "");
    } else {
      setDayType("work");
      setHasSecondary(false);
      setSecondaryType("work");
      setCheckIn("09:00");
      setCheckOut("17:00");
      setNote("");
    }
  }, [open, record]);

  if (!date) return null;

  const effectiveSecondary = hasSecondary ? secondaryType : null;
  const involvesWork = dayType === "work" || effectiveSecondary === "work";
  const secondaryConflicts = hasSecondary && secondaryType === dayType;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!date) return;
    setError(null);

    if (secondaryConflicts) {
      setError("Secondary type must differ from primary day type");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        date,
        day_type: dayType,
        partial_secondary_type: effectiveSecondary,
        check_in: involvesWork ? `${checkIn}:00` : null,
        check_out: involvesWork ? `${checkOut}:00` : null,
        note: note || null,
      });
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "could not save record";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Day report — ${date}`}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div>
          <label className="label">Day type</label>
          <select
            className="input"
            value={dayType}
            disabled={locked}
            onChange={(e) => setDayType(e.target.value as DayType)}
          >
            {DAY_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-3">
          <label className="flex items-center gap-2 text-sm font-medium text-ink-800">
            <input
              type="checkbox"
              checked={hasSecondary}
              disabled={locked}
              onChange={(e) => setHasSecondary(e.target.checked)}
            />
            Partial day — also includes a secondary activity
          </label>
          {hasSecondary && (
            <div className="mt-3">
              <label className="label">Secondary type</label>
              <select
                className="input"
                value={secondaryType}
                disabled={locked}
                onChange={(e) => setSecondaryType(e.target.value as DayType)}
              >
                {DAY_TYPE_OPTIONS.filter((o) => o.value !== dayType).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {secondaryConflicts && (
                <p className="mt-1 text-xs text-rose-600">
                  Secondary must differ from primary.
                </p>
              )}
            </div>
          )}
        </div>

        {involvesWork && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Check in"
              type="time"
              required
              value={checkIn}
              disabled={locked}
              onChange={(e) => setCheckIn(e.target.value)}
            />
            <Input
              label="Check out"
              type="time"
              required
              value={checkOut}
              disabled={locked}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </div>
        )}

        <div>
          <label className="label">Note</label>
          <textarea
            className="input min-h-[80px]"
            value={note}
            disabled={locked}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional notes…"
          />
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {record && !locked && (
            <Button
              type="button"
              variant="danger"
              onClick={async () => {
                setSaving(true);
                try {
                  await onDelete();
                  onClose();
                } finally {
                  setSaving(false);
                }
              }}
              loading={saving}
            >
              Delete
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
          {!locked && (
            <Button type="submit" loading={saving}>
              {record ? "Update" : "Save"}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
}
