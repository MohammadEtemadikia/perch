"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ChangelogEntry } from "@/lib/types";
import { useToast } from "./Toast";
import { GitCommitHorizontal, Plus } from "lucide-react";

export function ChangelogTab({ projectId, entries, hasGit }: { projectId: number; entries: ChangelogEntry[]; hasGit: boolean }) {
  const [summary, setSummary] = useState("");
  const [version, setVersion] = useState("");
  const [importing, setImporting] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function addEntry() {
    if (!summary.trim()) return;
    await fetch(`/api/projects/${projectId}/changelog`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ summary: summary.trim(), version: version.trim() || null }),
    });
    setSummary("");
    setVersion("");
    router.refresh();
  }

  async function importFromGit() {
    setImporting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/changelog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import_from_git" }),
      });
      const data = await res.json();
      toast.push(`Imported ${data.imported} commit${data.imported === 1 ? "" : "s"} from git history.`, "success");
      router.refresh();
    } catch {
      toast.push("Could not import from git.", "error");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          placeholder="v1.2.0 (optional)"
          className="w-32 rounded-md border px-2.5 py-1.5 text-[13px]"
          style={{ background: "var(--bg-inset)", borderColor: "var(--border)" }}
        />
        <input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addEntry()}
          placeholder="What changed?"
          className="flex-1 rounded-md border px-2.5 py-1.5 text-[13px]"
          style={{ background: "var(--bg-inset)", borderColor: "var(--border)" }}
        />
        <button onClick={addEntry} disabled={!summary.trim()} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-50" style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
          <Plus size={13} /> Add
        </button>
        {hasGit && (
          <button onClick={importFromGit} disabled={importing} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12.5px] font-medium" style={{ borderColor: "var(--border-strong)" }}>
            <GitCommitHorizontal size={13} /> {importing ? "Importing…" : "Import from git"}
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed py-10 text-center text-[12.5px]" style={{ borderColor: "var(--border-strong)", color: "var(--text-faint)" }}>
          No changelog entries yet.
        </div>
      ) : (
        <div className="mt-5 space-y-4 border-l pl-4" style={{ borderColor: "var(--border)" }}>
          {entries.map((e) => (
            <div key={e.id} className="relative">
              <div className="absolute -left-[21px] top-1 h-2 w-2 rounded-full" style={{ background: e.source === "git" ? "var(--text-faint)" : "var(--accent)" }} />
              <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--text-faint)" }}>
                {e.version && <span className="font-semibold" style={{ color: "var(--text)" }}>{e.version}</span>}
                {e.entry_date && <span>{new Date(e.entry_date).toLocaleDateString()}</span>}
                {e.source === "git" && <span className="font-mono">{e.commit_sha?.slice(0, 7)}</span>}
              </div>
              <div className="text-[13px]">{e.summary}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
