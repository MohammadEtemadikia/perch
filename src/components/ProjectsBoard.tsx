"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { ProjectWithCounts, ProjectStatus, ProjectType } from "@/lib/types";
import { ProjectCard } from "./ProjectCard";
import { NewProjectModal } from "./NewProjectModal";
import { ImportProjectModal } from "./ImportProjectModal";
import { Plus, FolderInput, Search, LayoutGrid, List } from "lucide-react";
import Link from "next/link";
import { HealthBadge, StatusBadge, PriorityBadge } from "./badges";
import { statusLabel, typeLabel } from "@/lib/i18n/labels";
import { useT } from "@/lib/i18n/provider";
import { intlLocale } from "@/lib/i18n/dictionaries";

const STATUS_FILTERS: ProjectStatus[] = ["idea", "prototype", "development", "active", "production", "paused", "completed", "archived"];
const TYPE_FILTERS: ProjectType[] = ["web_app", "website", "saas", "automation", "ai_tool", "mobile_app", "desktop_app", "api", "experiment", "internal_tool", "other"];

export function ProjectsBoard({ projects }: { projects: ProjectWithCounts[] }) {
  const { t, locale } = useT();
  const params = useSearchParams();
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ProjectType | "all">("all");
  const [tagFilter, setTagFilter] = useState<string | "all">("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "updated" | "health">("updated");

  useEffect(() => {
    if (params.get("new") === "1") setShowNew(true);
    if (params.get("import") === "1") setShowImport(true);
  }, [params]);

  function closeModals() {
    setShowNew(false);
    setShowImport(false);
    router.replace("/projects");
  }

  const allTags = useMemo(() => Array.from(new Set(projects.flatMap((p) => p.tags))).sort(), [projects]);

  const filtered = useMemo(() => {
    let list = projects;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? "").toLowerCase().includes(q) ||
          p.technologies.some((t) => t.name.toLowerCase().includes(q)) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== "all") list = list.filter((p) => p.status === statusFilter);
    if (typeFilter !== "all") list = list.filter((p) => p.type === typeFilter);
    if (tagFilter !== "all") list = list.filter((p) => p.tags.includes(tagFilter));

    const healthRank: Record<string, number> = { broken: 0, needs_attention: 1, unknown: 2, healthy: 3, archived: 4 };
    list = [...list].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "health") return (healthRank[a.health] ?? 9) - (healthRank[b.health] ?? 9);
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return list;
  }, [projects, query, statusFilter, typeFilter, tagFilter, sortBy]);

  const selectStyle = { background: "var(--bg-inset)", borderColor: "var(--border)" };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-md border px-2.5 py-1.5" style={selectStyle}>
          <Search size={14} style={{ color: "var(--text-faint)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("projects.searchPlaceholder")}
            className="w-full bg-transparent text-[13px] outline-none"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "all")} className="rounded-md border px-2.5 py-1.5 text-[12.5px]" style={selectStyle}>
          <option value="all">{t("projects.allStatuses")}</option>
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s, locale)}
            </option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as ProjectType | "all")} className="rounded-md border px-2.5 py-1.5 text-[12.5px]" style={selectStyle}>
          <option value="all">{t("projects.allTypes")}</option>
          {TYPE_FILTERS.map((ty) => (
            <option key={ty} value={ty}>
              {typeLabel(ty, locale)}
            </option>
          ))}
        </select>
        {allTags.length > 0 && (
          <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} className="rounded-md border px-2.5 py-1.5 text-[12.5px]" style={selectStyle}>
            <option value="all">{t("projects.allTags")}</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        )}
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="rounded-md border px-2.5 py-1.5 text-[12.5px]" style={selectStyle}>
          <option value="updated">{t("projects.sortUpdated")}</option>
          <option value="name">{t("projects.sortName")}</option>
          <option value="health">{t("projects.sortHealth")}</option>
        </select>
        <div className="flex rounded-md border" style={{ borderColor: "var(--border)" }}>
          <button onClick={() => setView("grid")} className="px-2 py-1.5" style={{ background: view === "grid" ? "var(--bg-inset)" : "transparent" }}>
            <LayoutGrid size={14} />
          </button>
          <button onClick={() => setView("list")} className="px-2 py-1.5" style={{ background: view === "list" ? "var(--bg-inset)" : "transparent" }}>
            <List size={14} />
          </button>
        </div>
        <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[12.5px] font-medium" style={{ borderColor: "var(--border-strong)" }}>
          <FolderInput size={14} /> {t("projects.import")}
        </button>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium" style={{ background: "var(--accent)", color: "var(--accent-fg)" }}>
          <Plus size={14} /> {t("projects.newProject")}
        </button>
      </div>

      <div className="mt-2 text-[11.5px]" style={{ color: "var(--text-faint)" }}>
        {t("projects.countOf", { filtered: filtered.length, total: projects.length })}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed py-16 text-center text-[12.5px]" style={{ borderColor: "var(--border-strong)", color: "var(--text-muted)" }}>
          {t("projects.noMatch")}
        </div>
      ) : view === "grid" ? (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="border-b text-left" style={{ borderColor: "var(--border)", background: "var(--bg-inset)", color: "var(--text-faint)" }}>
                <th className="px-3 py-2 font-medium">{t("projects.colName")}</th>
                <th className="px-3 py-2 font-medium">{t("projects.colStatus")}</th>
                <th className="px-3 py-2 font-medium">{t("projects.colHealth")}</th>
                <th className="px-3 py-2 font-medium">{t("projects.colPriority")}</th>
                <th className="px-3 py-2 font-medium">{t("projects.colType")}</th>
                <th className="px-3 py-2 font-medium">{t("projects.colTasks")}</th>
                <th className="px-3 py-2 font-medium">{t("projects.colBugs")}</th>
                <th className="px-3 py-2 font-medium">{t("projects.colUpdated")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
                  <td className="px-3 py-2">
                    <Link href={`/projects/${p.slug}`} className="font-medium">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    <StatusBadge status={p.status} locale={locale} />
                  </td>
                  <td className="px-3 py-2">
                    <HealthBadge health={p.health} locale={locale} />
                  </td>
                  <td className="px-3 py-2">
                    <PriorityBadge priority={p.priority} locale={locale} />
                  </td>
                  <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>
                    {typeLabel(p.type, locale)}
                  </td>
                  <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>
                    {p.open_tasks}
                  </td>
                  <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>
                    {p.open_bugs}
                  </td>
                  <td className="px-3 py-2" style={{ color: "var(--text-faint)" }}>
                    {new Date(p.updated_at).toLocaleDateString(intlLocale(locale))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && <NewProjectModal onClose={closeModals} />}
      {showImport && <ImportProjectModal onClose={closeModals} />}
    </div>
  );
}
