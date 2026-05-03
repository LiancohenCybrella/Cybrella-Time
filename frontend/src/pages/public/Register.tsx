import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { AuthShell } from "../../components/layout/AuthShell";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { apiError } from "../../api/client";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    phone: "",
    job_title: "",
    department: "",
    employment_type: "full_time" as "full_time" | "part_time" | "hourly",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const u = await register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        phone: form.phone || undefined,
        job_title: form.job_title || undefined,
        department: form.department || undefined,
        employment_type: form.employment_type,
      });
      navigate(u.role === "admin" ? "/admin" : "/", { replace: true });
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <AuthShell title="Create account" subtitle="Registration is invite-only. Your email must be on the allow list.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Input
          label="Full name"
          required
          value={form.full_name}
          onChange={(e) => set("full_name", e.target.value)}
        />
        <Input
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => set("password", e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Job title"
            value={form.job_title}
            onChange={(e) => set("job_title", e.target.value)}
          />
          <Input
            label="Department"
            value={form.department}
            onChange={(e) => set("department", e.target.value)}
          />
        </div>
        <Input
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
        />
        <div>
          <label className="label">Employment type</label>
          <select
            className="input"
            value={form.employment_type}
            onChange={(e) =>
              set("employment_type", e.target.value as typeof form.employment_type)
            }
          >
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="hourly">Hourly</option>
          </select>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <Button type="submit" loading={loading}>
          Create account
        </Button>
        <p className="text-center text-xs text-ink-600">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
