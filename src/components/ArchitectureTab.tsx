import type { TechCategory } from "@/lib/types";

const LAYERS: { category: TechCategory; label: string }[] = [
  { category: "framework", label: "Frontend / Framework" },
  { category: "api", label: "API" },
  { category: "auth", label: "Auth" },
  { category: "database", label: "Database" },
  { category: "hosting", label: "Hosting" },
];

export function ArchitectureTab({ technologies }: { technologies: { name: string; category: TechCategory }[] }) {
  const services = technologies.filter((t) => t.category === "service" || t.category === "integration");
  const hasAny = technologies.length > 0;

  return (
    <div>
      {!hasAny ? (
        <div className="rounded-xl border border-dashed py-10 text-center text-[12.5px]" style={{ borderColor: "var(--border-strong)", color: "var(--text-faint)" }}>
          No technology detected yet — run a scan from the header, or add technologies manually from the Overview tab.
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <LayerBox label="User" />
          <Arrow />
          {LAYERS.map((layer) => {
            const items = technologies.filter((t) => t.category === layer.category);
            if (items.length === 0) return null;
            return (
              <div key={layer.category} className="flex flex-col items-center gap-2">
                <LayerBox label={layer.label} items={items.map((i) => i.name)} />
                <Arrow />
              </div>
            );
          })}
          {services.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-2">
              {services.map((s) => (
                <LayerBox key={s.name} label={s.name} small />
              ))}
            </div>
          ) : (
            <div className="text-[12px]" style={{ color: "var(--text-faint)" }}>
              No external services detected.
            </div>
          )}
        </div>
      )}
      <p className="mt-5 text-center text-[11.5px]" style={{ color: "var(--text-faint)" }}>
        Built from what was actually detected in this project's dependencies and config — nothing here is invented.
      </p>
    </div>
  );
}

function LayerBox({ label, items, small }: { label: string; items?: string[]; small?: boolean }) {
  return (
    <div
      className="rounded-lg border px-4 py-2 text-center"
      style={{ borderColor: "var(--border-strong)", background: "var(--bg-inset)", minWidth: small ? 120 : 220 }}
    >
      <div className="text-[12.5px] font-semibold">{label}</div>
      {items && items.length > 0 && (
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--text-muted)" }}>
          {items.join(", ")}
        </div>
      )}
    </div>
  );
}

function Arrow() {
  return (
    <div className="text-[13px]" style={{ color: "var(--text-faint)" }}>
      ↓
    </div>
  );
}
