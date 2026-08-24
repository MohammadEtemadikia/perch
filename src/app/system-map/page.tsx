import Link from "next/link";
import { listProjects } from "@/lib/queries";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { HealthBadge } from "@/components/badges";
import type { TechCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

export default function SystemMapPage() {
  const projects = listProjects();
  const techByProject = new Map<number, { name: string; category: TechCategory }[]>();
  for (const p of projects) {
    const rows = db
      .prepare(
        `SELECT te.name, te.category FROM project_technologies pt JOIN technologies te ON te.id = pt.technology_id WHERE pt.project_id = ? AND te.category IN ('service','integration')`
      )
      .all(p.id) as { name: string; category: TechCategory }[];
    techByProject.set(p.id, rows);
  }

  return (
    <div>
      <PageHeader title="System Map" subtitle="Your whole software ecosystem, at a glance." />
      <div className="overflow-x-auto p-8">
        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center text-[12.5px]" style={{ borderColor: "var(--border-strong)", color: "var(--text-muted)" }}>
            No projects yet.
          </div>
        ) : (
          <div className="flex min-w-max flex-col items-center">
            <Node label="MY PROJECTS" strong />
            <Trunk />
            <div className="flex gap-6">
              {projects.map((p) => {
                const integrations = techByProject.get(p.id) ?? [];
                return (
                  <div key={p.id} className="flex flex-col items-center">
                    <Link href={`/projects/${p.slug}`}>
                      <Node label={p.name} sub={<HealthBadge health={p.health} />} />
                    </Link>
                    {integrations.length > 0 && (
                      <>
                        <Trunk short />
                        <div className="flex flex-col items-center gap-2">
                          {integrations.map((i) => (
                            <Node key={i.name} label={i.name} small />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Node({ label, sub, strong, small }: { label: string; sub?: React.ReactNode; strong?: boolean; small?: boolean }) {
  return (
    <div
      className="rounded-lg border px-4 py-2 text-center"
      style={{
        borderColor: strong ? "var(--accent)" : "var(--border-strong)",
        background: "var(--bg-elevated)",
        minWidth: small ? 110 : 160,
      }}
    >
      <div className={strong ? "text-[13.5px] font-bold" : small ? "text-[11.5px] font-medium" : "text-[13px] font-semibold"}>{label}</div>
      {sub && <div className="mt-1">{sub}</div>}
    </div>
  );
}

function Trunk({ short }: { short?: boolean }) {
  return <div style={{ width: 1, height: short ? 16 : 24, background: "var(--border-strong)" }} />;
}
