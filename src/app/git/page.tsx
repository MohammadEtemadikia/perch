import Link from "next/link";
import { listProjects } from "@/lib/queries";
import { getGitInfo } from "@/lib/git";
import { PageHeader } from "@/components/PageHeader";
import { GitBranch, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default function GitOverviewPage() {
  const projects = listProjects();
  const rows = projects.map((p) => ({ project: p, git: getGitInfo(p.local_path) }));
  const noRepo = rows.filter((r) => !r.git.isRepo).length;
  const dirty = rows.filter((r) => r.git.isRepo && !r.git.isClean).length;

  return (
    <div>
      <PageHeader title="Git" subtitle="Read-only repository status across every project. Nothing here ever commits, pushes, or resets anything." />
      <div className="p-6">
        {(noRepo > 0 || dirty > 0) && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-[12.5px]" style={{ borderColor: "var(--warning)", color: "var(--warning)" }}>
            <AlertTriangle size={14} />
            {noRepo > 0 && `${noRepo} project${noRepo === 1 ? " has" : "s have"} no git repository`}
            {noRepo > 0 && dirty > 0 && " · "}
            {dirty > 0 && `${dirty} project${dirty === 1 ? " has" : "s have"} uncommitted changes`}
          </div>
        )}
        <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
                <th className="px-3 py-2 font-medium">Project</th>
                <th className="px-3 py-2 font-medium">Branch</th>
                <th className="px-3 py-2 font-medium">Working tree</th>
                <th className="px-3 py-2 font-medium">Last commit</th>
                <th className="px-3 py-2 font-medium">Remote</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ project, git }) => (
                <tr key={project.id} className="border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
                  <td className="px-3 py-2">
                    <Link href={`/projects/${project.slug}?tab=git`} className="font-medium">
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    {git.isRepo ? (
                      <span className="flex items-center gap-1"><GitBranch size={12} /> {git.branch}</span>
                    ) : (
                      <span style={{ color: "var(--text-faint)" }}>no repo</span>
                    )}
                  </td>
                  <td className="px-3 py-2" style={{ color: git.isRepo ? (git.isClean ? "var(--success)" : "var(--warning)") : "var(--text-faint)" }}>
                    {git.isRepo ? (git.isClean ? "Clean" : `${git.modifiedFiles.length + git.untrackedFiles.length} changed`) : "—"}
                  </td>
                  <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>
                    {git.lastCommit ? new Date(git.lastCommit.date).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-3 py-2 truncate" style={{ color: "var(--text-faint)", maxWidth: 220 }} title={git.remoteUrl ?? ""}>
                    {git.remoteUrl ?? "none"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
