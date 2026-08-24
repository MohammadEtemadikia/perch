"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ImportantFile } from "@/lib/types";
import { Plus, FolderTree } from "lucide-react";

export function FilesTab({ projectId, files, topLevelDirs }: { projectId: number; files: ImportantFile[]; topLevelDirs: string[] }) {
  const [path, setPath] = useState("");
  const [purpose, setPurpose] = useState("");
  const router = useRouter();

  async function addFile() {
    if (!path.trim()) return;
    const next = [...files.map((f) => ({ ...f })), { path: path.trim(), purpose: purpose.trim() || null, importance: "medium" as const, safe_to_modify: 1 as const, related_functionality: null }];
    await fetch(`/api/projects/${projectId}/files`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files: next }),
    });
    setPath("");
    setPurpose("");
    router.refresh();
  }

  return (
    <div className="grid grid-cols-2 gap-5">
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-[12.5px] font-semibold">
          <FolderTree size={14} /> Top-level structure
        </div>
        {topLevelDirs.length === 0 ? (
          <p className="text-[12px]" style={{ color: "var(--text-faint)" }}>
            Run a scan from the header to detect this project's folder structure.
          </p>
        ) : (
          <div className="rounded-lg border p-3 font-mono text-[12px]" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            {topLevelDirs.map((d) => (
              <div key={d}>{d}/</div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 text-[12.5px] font-semibold">Important files</div>
        <div className="flex gap-1.5">
          <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="src/lib/auth.ts" className="flex-1 rounded-md border px-2 py-1.5 text-[12px]" style={{ background: "var(--bg-inset)", borderColor: "var(--border)" }} />
          <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Purpose" className="flex-1 rounded-md border px-2 py-1.5 text-[12px]" style={{ background: "var(--bg-inset)", borderColor: "var(--border)" }} />
          <button onClick={addFile} disabled={!path.trim()} className="rounded-md px-2.5 py-1.5 disabled:opacity-50" style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
            <Plus size={13} />
          </button>
        </div>
        {files.length === 0 ? (
          <p className="mt-2 text-[12px]" style={{ color: "var(--text-faint)" }}>
            Nothing marked yet — flag files that matter (config, entry points, anything risky to touch).
          </p>
        ) : (
          <div className="mt-2 overflow-hidden rounded-lg border" style={{ borderColor: "var(--border)" }}>
            {files.map((f) => (
              <div key={f.id} className="border-b px-2.5 py-1.5 text-[12px] last:border-b-0" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between">
                  <span className="font-mono">{f.path}</span>
                  <span
                    className="rounded-full px-1.5 py-[1px] text-[10px] capitalize"
                    style={{ background: "var(--bg-inset)", color: f.safe_to_modify ? "var(--success)" : "var(--danger)" }}
                  >
                    {f.safe_to_modify ? "safe to modify" : "handle with care"}
                  </span>
                </div>
                {f.purpose && (
                  <div style={{ color: "var(--text-faint)" }}>{f.purpose}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
