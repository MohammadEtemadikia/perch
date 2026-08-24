import type { GitInfo, GitLogEntry } from "@/lib/git";

export function GitTab({ git, recentCommits }: { git: GitInfo; recentCommits: GitLogEntry[] }) {
  if (!git.isRepo) {
    return (
      <div className="rounded-xl border border-dashed py-10 text-center text-[12.5px]" style={{ borderColor: "var(--border-strong)", color: "var(--text-faint)" }}>
        {git.error ?? "Not a git repository."}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-3">
        <InfoBox label="Branch" value={git.branch ?? "unknown"} />
        <InfoBox label="Remote" value={git.remoteUrl ?? "none"} />
        <InfoBox label="Working tree" value={git.isClean ? "Clean" : `${git.modifiedFiles.length + git.untrackedFiles.length} changed`} tone={git.isClean ? "ok" : "warn"} />
        <InfoBox label="Branches" value={String(git.branches.length)} />
      </div>

      {git.lastCommit && (
        <div className="mt-4 rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
          <div className="text-[11.5px] font-medium uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Last commit
          </div>
          <div className="mt-1 text-[13px]">{git.lastCommit.message}</div>
          <div className="mt-1 text-[11.5px]" style={{ color: "var(--text-faint)" }}>
            {git.lastCommit.author} · {new Date(git.lastCommit.date).toLocaleString()} · <span className="font-mono">{git.lastCommit.sha.slice(0, 7)}</span>
          </div>
        </div>
      )}

      {!git.isClean && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <FileList title="Modified" files={git.modifiedFiles} />
          <FileList title="Untracked" files={git.untrackedFiles} />
        </div>
      )}

      {recentCommits.length > 0 && (
        <div className="mt-4">
          <div className="mb-1.5 text-[11.5px] font-medium uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
            Recent commits
          </div>
          <div className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--border)" }}>
            {recentCommits.map((c) => (
              <div key={c.sha} className="flex items-center justify-between border-b px-3 py-2 text-[12px] last:border-b-0" style={{ borderColor: "var(--border)" }}>
                <span>{c.message}</span>
                <span className="font-mono" style={{ color: "var(--text-faint)" }}>
                  {c.sha.slice(0, 7)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-4 text-[11.5px]" style={{ color: "var(--text-faint)" }}>
        Read-only. Perch never commits, pushes, resets, or otherwise modifies git history on your behalf.
      </p>
    </div>
  );
}

function InfoBox({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div className="rounded-lg border p-2.5" style={{ borderColor: "var(--border)" }}>
      <div className="text-[10.5px] font-medium uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
        {label}
      </div>
      <div className="mt-0.5 truncate text-[12.5px]" style={{ color: tone === "warn" ? "var(--warning)" : tone === "ok" ? "var(--success)" : "var(--text)" }} title={value}>
        {value}
      </div>
    </div>
  );
}

function FileList({ title, files }: { title: string; files: string[] }) {
  if (files.length === 0) return null;
  return (
    <div className="rounded-lg border p-2.5" style={{ borderColor: "var(--border)" }}>
      <div className="text-[10.5px] font-medium uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
        {title} ({files.length})
      </div>
      <div className="mt-1.5 max-h-32 space-y-0.5 overflow-y-auto font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
        {files.map((f) => (
          <div key={f} className="truncate">
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}
