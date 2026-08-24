import type { Project, TechCategory } from "@/lib/types";
import { Tag } from "./badges";

const CATEGORY_LABELS: Record<TechCategory, string> = {
  framework: "Framework",
  language: "Language",
  runtime: "Runtime",
  package_manager: "Package manager",
  database: "Database",
  css: "CSS",
  auth: "Auth",
  hosting: "Hosting",
  api: "API",
  service: "Service",
  integration: "Integration",
  other: "Other",
};

export function OverviewTab({ project, technologies, tags }: { project: Project; technologies: { name: string; category: TechCategory }[]; tags: string[] }) {
  const grouped = technologies.reduce<Record<string, string[]>>((acc, t) => {
    acc[t.category] = acc[t.category] ?? [];
    acc[t.category].push(t.name);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-2 gap-5">
      <div className="space-y-4">
        <Section title="Basic information">
          <Row label="Purpose" value={project.purpose ?? "—"} />
          <Row label="Priority" value={project.priority} capitalize />
          <Row label="Owner" value={project.owner ?? "—"} />
          <Row label="Version" value={project.version ?? "—"} />
          <Row label="Completion" value={project.completion_percentage !== null ? `${project.completion_percentage}%` : "—"} />
          <Row label="Created" value={new Date(project.created_at).toLocaleDateString()} />
          <Row label="Last updated" value={new Date(project.updated_at).toLocaleString()} />
          <Row label="Last scanned" value={project.last_scanned_at ? new Date(project.last_scanned_at).toLocaleString() : "Never"} />
        </Section>

        <Section title="Location">
          <Row label="Local path" value={project.local_path ?? "—"} mono />
          <Row label="Git remote" value={project.git_remote_url ?? "—"} mono />
          <Row label="Production URL" value={project.production_url ?? "—"} mono />
          <Row label="Staging URL" value={project.staging_url ?? "—"} mono />
        </Section>

        {tags.length > 0 && (
          <Section title="Tags">
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <Tag key={t} label={t} />
              ))}
            </div>
          </Section>
        )}

        {project.notes && (
          <Section title="Notes">
            <p className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>
              {project.notes}
            </p>
          </Section>
        )}
      </div>

      <div>
        <Section title="Technology">
          {technologies.length === 0 ? (
            <p className="text-[12.5px]" style={{ color: "var(--text-faint)" }}>
              Nothing detected yet — run a scan from the header.
            </p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(grouped).map(([category, names]) => (
                <div key={category}>
                  <div className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
                    {CATEGORY_LABELS[category as TechCategory] ?? category}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {names.map((n) => (
                      <Tag key={n} label={n} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-3.5" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
      <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value, mono, capitalize }: { label: string; value: string; mono?: boolean; capitalize?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1 text-[12.5px]">
      <span style={{ color: "var(--text-faint)" }}>{label}</span>
      <span className={`truncate text-right ${mono ? "font-mono" : ""} ${capitalize ? "capitalize" : ""}`} title={value}>
        {value}
      </span>
    </div>
  );
}
