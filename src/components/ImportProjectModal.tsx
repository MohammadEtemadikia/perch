"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./Modal";
import { useToast } from "./Toast";
import type { ScanReport } from "@/lib/scanner";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";

const inputStyle = { background: "var(--bg-inset)", borderColor: "var(--border)" };

export function ImportProjectModal({ onClose }: { onClose: () => void }) {
  const [targetPath, setTargetPath] = useState("");
  const [report, setReport] = useState<ScanReport | null>(null);
  const [scanning, setScanning] = useState(false);
  const [importing, setImporting] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function scan() {
    if (!targetPath.trim()) return;
    setScanning(true);
    setReport(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: targetPath.trim() }),
      });
      const data = await res.json();
      setReport(data.report);
    } catch {
      toast.push("Scan failed.", "error");
    } finally {
      setScanning(false);
    }
  }

  async function doImport() {
    setImporting(true);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: targetPath.trim(), createProject: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.push(data.error ?? "Could not import.", "error");
        return;
      }
      toast.push(`Imported "${data.project.name}"`, "success");
      router.push(`/projects/${data.project.slug}`);
      router.refresh();
      onClose();
    } catch {
      toast.push("Import failed.", "error");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal title="Import Existing Project" onClose={onClose} width={560}>
      <p className="mb-3 text-[12.5px]" style={{ color: "var(--text-muted)" }}>
        Point at a folder on this machine. Perch reads it read-only to detect its stack, git status, and docs — nothing is modified.
      </p>
      <div className="flex gap-2">
        <input
          value={targetPath}
          onChange={(e) => setTargetPath(e.target.value)}
          placeholder="/Users/you/Projects/my-app"
          className="flex-1 rounded-md border px-2.5 py-1.5 text-[13px]"
          style={inputStyle}
          autoFocus
        />
        <button
          onClick={scan}
          disabled={!targetPath.trim() || scanning}
          className="rounded-md border px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-50"
          style={{ borderColor: "var(--border-strong)" }}
        >
          {scanning ? "Scanning…" : "Scan"}
        </button>
      </div>

      {report && (
        <div className="mt-4 rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
          {!report.exists ? (
            <div className="flex items-center gap-2 text-[12.5px]" style={{ color: "var(--danger)" }}>
              <XCircle size={14} /> That path does not exist.
            </div>
          ) : (
            <>
              <div className="text-[13.5px] font-semibold">{report.name}</div>
              <div className="mt-2 grid grid-cols-2 gap-1.5 text-[12px]">
                <ScanRow ok={report.hasReadme} label="README" />
                <ScanRow ok={report.hasClaudeMd} label="CLAUDE.md" />
                <ScanRow ok={report.git.isRepo} label="Git repository" />
                <ScanRow ok={report.hasEnvExample} label=".env.example" unknown={!report.hasEnvExample && !report.hasEnvFile} />
                <div className="col-span-2 mt-1 flex flex-wrap gap-1.5">
                  {report.technologies.slice(0, 8).map((t) => (
                    <span key={t.name} className="rounded-full px-2 py-[2px] text-[11px]" style={{ background: "var(--bg-inset)", color: "var(--text-muted)" }}>
                      {t.name}
                    </span>
                  ))}
                </div>
              </div>
              {report.recommendedActions.length > 0 && (
                <div className="mt-2.5 border-t pt-2 text-[11.5px]" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
                  {report.recommendedActions.map((a) => (
                    <div key={a}>· {a}</div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-md border px-3 py-1.5 text-[12.5px]" style={{ borderColor: "var(--border)" }}>
          Cancel
        </button>
        <button
          onClick={doImport}
          disabled={!report?.exists || importing}
          className="rounded-md px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
        >
          {importing ? "Importing…" : "Import this project"}
        </button>
      </div>
    </Modal>
  );
}

function ScanRow({ ok, label, unknown }: { ok: boolean; label: string; unknown?: boolean }) {
  const Icon = unknown ? HelpCircle : ok ? CheckCircle2 : XCircle;
  const color = unknown ? "var(--text-faint)" : ok ? "var(--success)" : "var(--danger)";
  return (
    <div className="flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
      <Icon size={13} style={{ color }} />
      {label}
    </div>
  );
}
