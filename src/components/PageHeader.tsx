export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between border-b px-6 py-4" style={{ borderColor: "var(--border)" }}>
      <div>
        <h1 className="text-[16px] font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 text-[12.5px]" style={{ color: "var(--text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
