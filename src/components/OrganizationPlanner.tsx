"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectWithCounts } from "@/lib/types";
import type { MovePlan } from "@/lib/organization";
import { useToast } from "./Toast";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

const inputStyle = { background: "var(--bg-inset)", borderColor: "var(--border)" };

export function OrganizationPlanner({ projects, orgRoot }: { projects: ProjectWithCounts[]; orgRoot: string }) {
  const [projectId, setProjectId] = useState<number | "">("");
  const [destination, setDestination] = useState("");
  const [plan, setPlan] = useState<MovePlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function pickProject(id: number) {
    setProjectId(id);
    setPlan(null);
    if (!orgRoot) {
      setDestination("");
      return;
    }
    const res = await fetch(`/api/organization/suggest?projectId=${id}`);
    const data = await res.json();
    if (res.ok) setDestination(data.suggested);
  }

  async function dryRun() {
    if (!projectId || !destination.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/organization/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, destination: destination.trim() }),
      });
      setPlan(await res.json());
    } finally {
      setLoading(false);
    }
  }

  async function confirmMove() {
    if (!projectId || !destination.trim()) return;
    setMoving(true);
    try {
      const res = await fetch("/api/organization/move", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, destination: destination.trim(), confirm: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.push(data.error ?? "Move failed.", "error");
        return;
      }
      toast.push(`Moved to ${data.newPath}`, "success");
      setPlan(null);
      router.refresh();
    } finally {
      setMoving(false);
    }
  }

  const selected = projects.find((p) => p.id === projectId);

  return (
    <div className="p-6">
      {!orgRoot && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-[12.5px]" style={{ borderColor: "var(--warning)", color: "var(--warning)" }}>
          <AlertTriangle size={14} />
          No organization root folder is set — set one in Settings to get suggested destinations, or just type a destination path manually below.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <div className="mb-1 text-[11.5px] font-medium" style={{ color: "var(--text-muted)" }}>
            Project
          </div>
          <select value={projectId} onChange={(e) => pickProject(Number(e.target.value))} className="w-full rounded-md border px-2.5 py-1.5 text-[13px]" style={inputStyle}>
            <option value="">Select a project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.local_path}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <div className="mb-1 text-[11.5px] font-medium" style={{ color: "var(--text-muted)" }}>
            Destination path
          </div>
          <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="/Users/you/Projects/01_ACTIVE/My Project" className="w-full rounded-md border px-2.5 py-1.5 text-[13px]" style={inputStyle} />
        </label>
      </div>

      <button
        onClick={dryRun}
        disabled={!projectId || !destination.trim() || loading}
        className="mt-3 rounded-md border px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-50"
        style={{ borderColor: "var(--border-strong)" }}
      >
        {loading ? "Checking…" : "Run dry run"}
      </button>

      {plan && selected && (
        <div className="mt-5 rounded-xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
          <div className="grid grid-cols-2 gap-3 text-[12.5px]">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
                Current
              </div>
              <div className="font-mono">{plan.currentPath}</div>
            </div>
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
                Recommended
              </div>
              <div className="font-mono">{plan.recommendedPath}</div>
            </div>
          </div>
          <div className="mt-3 space-y-1.5">
            {plan.checks.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[12px]" style={{ color: c.level === "fail" ? "var(--danger)" : c.level === "warn" ? "var(--warning)" : "var(--text-muted)" }}>
                {c.level === "pass" ? <CheckCircle2 size={13} /> : c.level === "warn" ? <AlertTriangle size={13} /> : <XCircle size={13} />}
                {c.label}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={confirmMove}
              disabled={!plan.canProceed || moving}
              className="rounded-md px-3.5 py-1.5 text-[12.5px] font-medium disabled:opacity-50"
              style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
            >
              {moving ? "Moving…" : "Confirm and move"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
