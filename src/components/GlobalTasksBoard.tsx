"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Task, TaskStatus } from "@/lib/types";
import { PriorityBadge, TaskStatusBadge, Tag, parseLabels } from "./badges";
import { taskStatusLabel } from "@/lib/i18n/labels";
import { useT } from "@/lib/i18n/provider";

type TaskRow = Task & { project_name: string; project_slug: string };

export function GlobalTasksBoard({ tasks }: { tasks: TaskRow[] }) {
  const { t, locale } = useT();
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [labelFilter, setLabelFilter] = useState<string | "all">("all");
  const [query, setQuery] = useState("");

  const allLabels = useMemo(() => Array.from(new Set(tasks.flatMap((t) => parseLabels(t.labels)))).sort(), [tasks]);

  const filtered = useMemo(() => {
    let list = tasks;
    if (statusFilter !== "all") list = list.filter((t) => t.status === statusFilter);
    if (labelFilter !== "all") list = list.filter((t) => parseLabels(t.labels).includes(labelFilter));
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || t.project_name.toLowerCase().includes(q));
    }
    return list;
  }, [tasks, statusFilter, labelFilter, query]);

  const selectStyle = { background: "var(--bg-inset)", borderColor: "var(--border)" };

  return (
    <div className="p-6">
      <div className="flex items-center gap-2">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("tasks.searchPlaceholder")} className="flex-1 rounded-md border px-2.5 py-1.5 text-[13px]" style={selectStyle} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "all")} className="rounded-md border px-2.5 py-1.5 text-[12.5px]" style={selectStyle}>
          <option value="all">{t("tasks.allStatuses")}</option>
          {(["backlog", "todo", "in_progress", "blocked", "review", "done"] as TaskStatus[]).map((s) => (
            <option key={s} value={s}>
              {taskStatusLabel(s, locale)}
            </option>
          ))}
        </select>
        {allLabels.length > 0 && (
          <select value={labelFilter} onChange={(e) => setLabelFilter(e.target.value)} className="rounded-md border px-2.5 py-1.5 text-[12.5px]" style={selectStyle}>
            <option value="all">{t("tasks.allLabels")}</option>
            {allLabels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed py-16 text-center text-[12.5px]" style={{ borderColor: "var(--border-strong)", color: "var(--text-muted)" }}>
          {t("tasks.noMatch")}
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: "var(--border)", background: "var(--bg-inset)", color: "var(--text-faint)" }}>
                <th className="px-3 py-2 font-medium">{t("tasks.colTask")}</th>
                <th className="px-3 py-2 font-medium">{t("tasks.colProject")}</th>
                <th className="px-3 py-2 font-medium">{t("tasks.colLabels")}</th>
                <th className="px-3 py-2 font-medium">{t("tasks.colStatus")}</th>
                <th className="px-3 py-2 font-medium">{t("tasks.colPriority")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
                  <td className="px-3 py-2">{row.title}</td>
                  <td className="px-3 py-2">
                    <Link href={`/projects/${row.project_slug}?tab=tasks`} style={{ color: "var(--accent)" }}>
                      {row.project_name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    {parseLabels(row.labels).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {parseLabels(row.labels).map((l) => (
                          <Tag key={l} label={l} />
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <TaskStatusBadge status={row.status} locale={locale} />
                  </td>
                  <td className="px-3 py-2">
                    <PriorityBadge priority={row.priority} locale={locale} />
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
