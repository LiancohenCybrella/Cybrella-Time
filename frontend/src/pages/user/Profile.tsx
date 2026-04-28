import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { updateMe } from "../../api/auth";
import { apiError } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { UserLayout } from "../../components/layout/UserLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function Profile() {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    job_title: "",
    department: "",
    employment_type: "full_time" as "full_time" | "part_time" | "hourly",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setForm({
      full_name: user.full_name ?? "",
      phone: user.phone ?? "",
      job_title: user.job_title ?? "",
      department: user.department ?? "",
      employment_type: user.employment_type,
    });
  }, [user]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await updateMe(form);
      await refresh();
      setToast("Profile updated.");
      setTimeout(() => setToast(null), 1800);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <UserLayout>
      <h1 className="mb-5 text-2xl font-semibold tracking-tight">Profile</h1>
      <form onSubmit={onSubmit} className="card flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-xl font-semibold text-white">
            {user?.full_name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div>
            <p className="font-medium">{user?.email}</p>
            <p className="text-xs uppercase tracking-wider text-ink-500">{user?.role}</p>
          </div>
        </div>

        <Input
          label="Full name"
          value={form.full_name}
          onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Job title"
            value={form.job_title}
            onChange={(e) => setForm({ ...form, job_title: e.target.value })}
          />
          <Input
            label="Department"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          />
        </div>
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <div>
          <label className="label">Employment type</label>
          <select
            className="input"
            value={form.employment_type}
            onChange={(e) =>
              setForm({
                ...form,
                employment_type: e.target.value as typeof form.employment_type,
              })
            }
          >
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="hourly">Hourly</option>
          </select>
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/profile/password" className="text-sm text-brand-600 hover:underline">
            Change password →
          </Link>
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-ink-900 px-4 py-2 text-sm text-white shadow-glow animate-fade-up">
          {toast}
        </div>
      )}
    </UserLayout>
  );
}
