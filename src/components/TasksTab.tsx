"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Task, TaskStatus } from "@/lib/types";
import { PriorityBadge, Tag, parseLabels } from "./badges";
import { taskStatusLabel } from "@/lib/i18n/labels";
import { useT } from "@/lib/i18n/provider";
import { Plus, Kanban, List, Trash2 } from "lucide-react";
import { useToast } from "./Toast";

const COLUMN_KEYS: TaskStatus[] = ["backlog", "todo", "in_progress", "blocked", "review", "done"];

export function TasksTab({ projectId, tasks }: { projectId: number; tasks: Task[] }) {
  const { t, locale } = useT();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [title, setTitle] = useState("");
  const [labelsInput, setLabelsInput] = useState("");
  const [labelFilter, setLabelFilter] = useState<string | "all">("all");
  const [adding, setAdding] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const allLabels = useMemo(() => Array.from(new Set(tasks.flatMap((t) => parseLabels(t.labels)))).sort(), [tasks]);
  const visibleTasks = useMemo(
    () => (labelFilter === "all" ? tasks : tasks.filter((t) => parseLabels(t.labels).includes(labelFilter))),
    [tasks, labelFilter]
  );

  async function addTask() {
    if (!title.trim()) return;
    setAdding(true);
    try {
      const labels = labelsInput
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), labels: labels.length > 0 ? JSON.stringify(labels) : undefined }),
      });
      if (!res.ok) throw new Error();
      setTitle("");
      setLabelsInput("");
      router.refresh();
    } catch {
      toast.push(t("tasks.createError"), "error");
    } finally {
      setAdding(false);
    }
  }

  async function setStatus(taskId: number, status: TaskStatus) {
    await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
  }

  async function removeTask(taskId: number) {
    await fetch(`/api/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder={t("tasks.addPlaceholder")}
          className="flex-1 rounded-md border px-2.5 py-1.5 text-[13px]"
          style={{ background: "var(--bg-inset)", borderColor: "var(--border)" }}
        />
        <input
          value={labelsInput}
          onChange={(e) => setLabelsInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder={t("tasks.labelsPlaceholder")}
          className="w-44 rounded-md border px-2.5 py-1.5 text-[13px]"
          style={{ background: "var(--bg-inset)", borderColor: "var(--border)" }}
        />
        <button
          onClick={addTask}
          disabled={!title.trim() || adding}
          className="flex items-center gap-1 rounded-md px-3 py-1.5 text-[12.5px] font-medium disabled:opacity-50"
          style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
        >
          <Plus size={13} /> {t("tasks.add")}
        </button>
        {allLabels.length > 0 && (
          <select
            value={labelFilter}
            onChange={(e) => setLabelFilter(e.target.value)}
            className="rounded-md border px-2.5 py-1.5 text-[12.5px]"
            style={{ background: "var(--bg-inset)", borderColor: "var(--border)" }}
          >
            <option value="all">{t("tasks.allLabels")}</option>
            {allLabels.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        )}
        <div className="flex rounded-md border" style={{ borderColor: "var(--border)" }}>
          <button onClick={() => setView("kanban")} className="px-2 py-1.5" style={{ background: view === "kanban" ? "var(--bg-inset)" : "transparent" }}>
            <Kanban size={14} />
          </button>
          <button onClick={() => setView("list")} className="px-2 py-1.5" style={{ background: view === "list" ? "var(--bg-inset)" : "transparent" }}>
            <List size={14} />
          </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed py-10 text-center text-[12.5px]" style={{ borderColor: "var(--border-strong)", color: "var(--text-faint)" }}>
          {t("tasks.noTasks")}
        </div>
      ) : visibleTasks.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed py-10 text-center text-[12.5px]" style={{ borderColor: "var(--border-strong)", color: "var(--text-faint)" }}>
          {t("tasks.noLabelMatch")}
        </div>
      ) : view === "kanban" ? (
        <div className="mt-4 grid grid-cols-6 gap-2.5">
          {COLUMN_KEYS.map((col) => (
            <div key={col} className="rounded-lg border" style={{ borderColor: "var(--border)", background: "var(--bg-inset)" }}>
              <div className="border-b px-2.5 py-2 text-[11.5px] font-semibold" style={{ borderColor: "var(--border)" }}>
                {taskStatusLabel(col, locale)} <span style={{ color: "var(--text-faint)" }}>({visibleTasks.filter((t) => t.status === col).length})</span>
              </div>
              <div className="space-y-1.5 p-1.5">
                {visibleTasks
                  .filter((t) => t.status === col)
                  .map((task) => (
                    <div key={task.id} className="rounded-md border p-2" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
                      <div className="text-[12px]">{task.title}</div>
                      {parseLabels(task.labels).length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {parseLabels(task.labels).map((l) => (
                            <Tag key={l} label={l} />
                          ))}
                        </div>
                      )}
                      <div className="mt-1.5 flex items-center justify-between">
                        <PriorityBadge priority={task.priority} locale={locale} />
                        <select
                          value={task.status}
                          onChange={(e) => setStatus(task.id, e.target.value as TaskStatus)}
                          className="rounded border bg-transparent text-[10.5px]"
                          style={{ borderColor: "var(--border)" }}
                        >
                          {COLUMN_KEYS.map((c) => (
                            <option key={c} value={c}>
                              {taskStatusLabel(c, locale)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-[12.5px]">
            <tbody>
              {visibleTasks.map((task) => (
                <tr key={task.id} className="border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
                  <td className="px-3 py-2">{task.title}</td>
                  <td className="px-3 py-2">
                    {parseLabels(task.labels).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {parseLabels(task.labels).map((l) => (
                          <Tag key={l} label={l} />
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={task.status}
                      onChange={(e) => setStatus(task.id, e.target.value as TaskStatus)}
                      className="rounded border bg-transparent px-1.5 py-0.5 text-[11.5px]"
                      style={{ borderColor: "var(--border)" }}
                    >
                      {COLUMN_KEYS.map((c) => (
                        <option key={c} value={c}>
                          {taskStatusLabel(c, locale)}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <PriorityBadge priority={task.priority} locale={locale} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => removeTask(task.id)} style={{ color: "var(--text-faint)" }}>
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
