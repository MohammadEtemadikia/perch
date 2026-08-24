import Link from "next/link";
import { listAllTechnologies, projectsUsingTechnology } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { Plug } from "lucide-react";

export const dynamic = "force-dynamic";

export default function IntegrationsPage() {
  const integrations = listAllTechnologies().filter((t) => t.category === "service" || t.category === "integration");

  return (
    <div>
      <PageHeader title="Integrations" subtitle="External services and APIs your projects actually depend on." />
      <div className="p-6">
        {integrations.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center text-[12.5px]" style={{ borderColor: "var(--border-strong)", color: "var(--text-muted)" }}>
            No external services detected yet.
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {integrations.map((t) => (
              <div key={t.name} className="rounded-xl border p-3.5" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
                <div className="flex items-center gap-1.5 text-[13.5px] font-semibold">
                  <Plug size={14} style={{ color: "var(--text-faint)" }} /> {t.name}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {projectsUsingTechnology(t.name).map((p) => (
                    <Link key={p.id} href={`/projects/${p.slug}`} className="rounded-full px-2 py-[2px] text-[11px]" style={{ background: "var(--bg-inset)", color: "var(--text-muted)" }}>
                      {p.name}
                    </Link>
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
