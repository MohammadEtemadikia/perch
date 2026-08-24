export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = "var(--accent)",
}: {
  label: string;
  value: number | string;
  hint?: string;
  icon?: React.ComponentType<{ size?: number }>;
  accent?: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border p-4"
      style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
    >
      <span className="absolute inset-y-0 start-0 w-[3px]" style={{ background: accent }} />
      <div className="flex items-center justify-between gap-2">
        <div className="truncate text-[11.5px] font-medium uppercase tracking-wide" style={{ color: "var(--text-faint)" }} title={label}>
          {label}
        </div>
        {Icon && (
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
            style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent }}
          >
            <Icon size={13} />
          </span>
        )}
      </div>
      <div className="mt-1.5 text-[26px] font-semibold leading-none">{value}</div>
      {hint && (
        <div className="mt-1.5 text-[11.5px]" style={{ color: "var(--text-muted)" }}>
          {hint}
        </div>
      )}
    </div>
  );
}
