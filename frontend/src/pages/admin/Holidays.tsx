import { FormEvent, useEffect, useState } from "react";
import * as adminApi from "../../api/admin";
import * as holidaysApi from "../../api/holidays";
import { apiError } from "../../api/client";
import { AdminLayout } from "../../components/layout/AdminLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function Holidays() {
  const [holidays, setHolidays] = useState<holidaysApi.Holiday[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ date: "", title: "", description: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setError(null);
    try {
      setHolidays(await holidaysApi.listHolidays());
    } catch (err) {
      setError(apiError(err));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.createHoliday({
        date: form.date,
        title: form.title,
        description: form.description || undefined,
      });
      setForm({ date: "", title: "", description: "" });
      await load();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete holiday?")) return;
    await adminApi.deleteHoliday(id);
    await load();
  }

  return (
    <AdminLayout>
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">Holidays</h1>

      {error && (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={onAdd} className="card mb-5 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Input
          label="Date"
          type="date"
          required
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <Input
          label="Title"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <Input
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="flex items-end">
          <Button type="submit" loading={saving} className="w-full">
            Add holiday
          </Button>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs uppercase tracking-wider text-ink-500">
              <th className="py-2 pr-3">Date</th>
              <th className="py-2 pr-3">Title</th>
              <th className="py-2 pr-3">Description</th>
              <th className="py-2 pr-3"></th>
            </tr>
          </thead>
          <tbody>
            {holidays.map((h) => (
              <tr key={h.id} className="border-b border-ink-50">
                <td className="py-2 pr-3 font-medium">{h.date}</td>
                <td className="py-2 pr-3">{h.title}</td>
                <td className="py-2 pr-3 text-ink-600">{h.description ?? "—"}</td>
                <td className="py-2 pr-3 text-right">
                  <Button variant="ghost" onClick={() => onDelete(h.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
            {holidays.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-ink-500">
                  No holidays defined.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
