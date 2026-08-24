import Link from "next/link";
import { listProjects, getClaudeKnowledge } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { CheckCircle2, XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default function DocumentationPage() {
  const projects = listProjects();
  const rows = projects.map((p) => ({ project: p, knowledge: getClaudeKnowledge(p.id) }));
  rows.sort((a, b) => (a.knowledge?.documentation_score ?? 0) - (b.knowledge?.documentation_score ?? 0));

  return (
    <div>
      <PageHeader title="Documentation" subtitle="Documentation completeness across every project." />
      <div className="p-6">
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed py-16 text-center text-[12.5px]" style={{ borderColor: "var(--border-strong)", color: "var(--text-muted)" }}>
            No projects yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
                  <th className="px-3 py-2 font-medium">Project</th>
                  <th className="px-3 py-2 font-medium">README</th>
                  <th className="px-3 py-2 font-medium">CLAUDE.md</th>
                  <th className="px-3 py-2 font-medium">Score</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ project, knowledge }) => (
                  <tr key={project.id} className="border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
                    <td className="px-3 py-2">
                      <Link href={`/projects/${project.slug}?tab=documentation`} className="font-medium">
                        {project.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{knowledge?.has_readme ? <CheckCircle2 size={14} style={{ color: "var(--success)" }} /> : <XCircle size={14} style={{ color: "var(--text-faint)" }} />}</td>
                    <td className="px-3 py-2">{knowledge?.has_claude_md ? <CheckCircle2 size={14} style={{ color: "var(--success)" }} /> : <XCircle size={14} style={{ color: "var(--text-faint)" }} />}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full" style={{ background: "var(--bg-inset)" }}>
                          <div className="h-full" style={{ width: `${knowledge?.documentation_score ?? 0}%`, background: "var(--accent)" }} />
                        </div>
                        <span style={{ color: "var(--text-faint)" }}>{knowledge?.documentation_score ?? 0}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
