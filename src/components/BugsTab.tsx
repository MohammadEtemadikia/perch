"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Bug, BugSeverity, BugStatus } from "@/lib/types";
import { SeverityBadge } from "./badges";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "./Toast";

const STATUSES: BugStatus[] = ["open", "in_progress", "fixed", "wont_fix", "duplicate"];
const SEVERITIES: BugSeverity[] = ["critical", "high", "medium", "low"];

export function BugsTab({ projectId, bugs }: { projectId: number; bugs: Bug[] }) {
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<BugSeverity>("medium");
  const router = useRouter();
  const toast = useToast();

  async function addBug() {
    if (!title.trim()) return;
    try {
      await fetch(`/api/projects/${projectId}/bugs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), severity }),
      });
      setTitle("");
      router.refresh();
    } catch {
      toast.push("Could not create bug.", "error");
    }
  }

  async function setStatus(id: number, status: BugStatus) {
    await fetch(`/api/projects/${projectId}/bugs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, date_fixed: status === "fixed" ? new Date().toISOString() : null }),
    });
    router.refresh();
  }

  async function removeBug(id: number) {
    await fetch(`/api/projects/${projectId}/bugs/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addBug()}
          placeholder="Describe the bug and press Enter…"
          className="flex-1 rounded-md border px-2.5 py-1.5 text-[13px]"
          style={{ background: "var(--bg-inset)", borderColor: "var(--border)" }}
        />
        <select value={severity} onChange={(e) => setSeverity(e.target.value as BugSeverity)} className="rounded-md border px-2 py-1.5 text-[12.5px] capitalize" style={{ background: "var(--bg-inset)", borderColor: "var(--border)" }}>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button onClick={addBug} disabled={!title.trim()} className="flex items-center gap-1 rounded-md px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-50" style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
          <Plus size={13} /> Add
        </button>
      </div>

      {bugs.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed py-10 text-center text-[12.5px]" style={{ borderColor: "var(--border-strong)", color: "var(--text-faint)" }}>
          No known bugs.
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-[12.5px]">
            <tbody>
              {bugs.map((b) => (
                <tr key={b.id} className="border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
                  <td className="px-3 py-2">
                    <SeverityBadge severity={b.severity} />
                  </td>
                  <td className="px-3 py-2">{b.title}</td>
                  <td className="px-3 py-2">
                    <select
                      value={b.status}
                      onChange={(e) => setStatus(b.id, e.target.value as BugStatus)}
                      className="rounded border bg-transparent px-1.5 py-0.5 text-[11.5px] capitalize"
                      style={{ borderColor: "var(--border)" }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => removeBug(b.id)} style={{ color: "var(--text-faint)" }}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
