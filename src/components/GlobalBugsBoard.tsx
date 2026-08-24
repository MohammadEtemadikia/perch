"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Bug, BugSeverity } from "@/lib/types";
import { SeverityBadge } from "./badges";

type BugRow = Bug & { project_name: string; project_slug: string };

export function GlobalBugsBoard({ bugs }: { bugs: BugRow[] }) {
  const [severityFilter, setSeverityFilter] = useState<BugSeverity | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list = bugs;
    if (severityFilter !== "all") list = list.filter((b) => b.severity === severityFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((b) => b.title.toLowerCase().includes(q) || b.project_name.toLowerCase().includes(q));
    }
    return list;
  }, [bugs, severityFilter, query]);

  const selectStyle = { background: "var(--bg-inset)", borderColor: "var(--border)" };

  return (
    <div className="p-6">
      <div className="flex items-center gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search bugs…" className="flex-1 rounded-md border px-2.5 py-1.5 text-[13px]" style={selectStyle} />
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value as BugSeverity | "all")} className="rounded-md border px-2.5 py-1.5 text-[12.5px] capitalize" style={selectStyle}>
          <option value="all">All severities</option>
          {(["critical", "high", "medium", "low"] as BugSeverity[]).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed py-16 text-center text-[12.5px]" style={{ borderColor: "var(--border-strong)", color: "var(--text-muted)" }}>
          No bugs match. Log bugs from a project's Bugs tab.
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
                <th className="px-3 py-2 font-medium">Severity</th>
                <th className="px-3 py-2 font-medium">Bug</th>
                <th className="px-3 py-2 font-medium">Project</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
                  <td className="px-3 py-2">
                    <SeverityBadge severity={b.severity} />
                  </td>
                  <td className="px-3 py-2">{b.title}</td>
                  <td className="px-3 py-2">
                    <Link href={`/projects/${b.project_slug}?tab=bugs`} style={{ color: "var(--accent)" }}>
                      {b.project_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 capitalize" style={{ color: "var(--text-muted)" }}>
                    {b.status.replace("_", " ")}
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
