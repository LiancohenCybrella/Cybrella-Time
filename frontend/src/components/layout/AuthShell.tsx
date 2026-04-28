import { ReactNode } from "react";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-ink-50 via-brand-50 to-white">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
        <div className="mb-8 animate-fade-up">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-ink-100 bg-white/60 px-3 py-1 text-xs font-medium uppercase tracking-wider text-ink-600 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-accent-500" />
            Cybrella Time
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-ink-600">{subtitle}</p>}
        </div>
        <div className="card animate-fade-up">{children}</div>
      </div>
    </div>
  );
}
