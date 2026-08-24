import Link from "next/link";
import { listAllTechnologies, projectsUsingTechnology } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";

export const dynamic = "force-dynamic";

export default function TechnologiesPage() {
  const technologies = listAllTechnologies().filter((t) => t.category !== "service" && t.category !== "integration");

  const grouped = technologies.reduce<Record<string, typeof technologies>>((acc, t) => {
    acc[t.category] = acc[t.category] ?? [];
    acc[t.category].push(t);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Technologies" subtitle="Every framework, language, and tool detected across your projects." />
      <div className="p-6">
        {technologies.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center text-[12.5px]" style={{ borderColor: "var(--border-strong)", color: "var(--text-muted)" }}>
            Nothing detected yet. Scan or import a project first.
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="mb-1.5 text-[11.5px] font-semibold uppercase tracking-wide capitalize" style={{ color: "var(--text-faint)" }}>
                  {category.replace("_", " ")}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {items.map((t) => (
                    <div key={t.name} className="rounded-lg border p-2.5" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
                      <div className="text-[13px] font-medium">{t.name}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {projectsUsingTechnology(t.name).map((p) => (
                          <Link key={p.id} href={`/projects/${p.slug}`} className="rounded-full px-1.5 py-[1px] text-[10.5px]" style={{ background: "var(--bg-inset)", color: "var(--text-muted)" }}>
                            {p.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
