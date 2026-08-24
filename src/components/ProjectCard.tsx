"use client";

import Link from "next/link";
import type { ProjectWithCounts } from "@/lib/types";
import { typeLabel } from "@/lib/i18n/labels";
import { useT } from "@/lib/i18n/provider";
import { HealthBadge, StatusBadge, Tag, healthColor } from "./badges";

export function ProjectCard({ project }: { project: ProjectWithCounts }) {
  const { t, locale } = useT();
  const accent = healthColor(project.health);
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="relative flex flex-col overflow-hidden rounded-xl border p-4 transition-all hover:-translate-y-[1px] hover:border-[var(--border-strong)] hover:shadow-[var(--shadow)]"
      style={{ background: "var(--bg-elevated)", borderColor: "var(--border)" }}
    >
      <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: accent }} />
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[14px] font-semibold">{project.name}</div>
          <div className="mt-0.5 text-[11.5px]" style={{ color: "var(--text-faint)" }}>
            {typeLabel(project.type, locale)}
            {project.version ? ` · v${project.version}` : ""}
          </div>
        </div>
        <HealthBadge health={project.health} locale={locale} />
      </div>

      <p className="mt-2.5 line-clamp-2 text-[12.5px]" style={{ color: "var(--text-muted)" }}>
        {project.description || t("projects.noDescription")}
      </p>

      {project.technologies.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.technologies.slice(0, 4).map((tech) => (
            <Tag key={tech.name} label={tech.name} />
          ))}
          {project.technologies.length > 4 && (
            <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
              {t("projects.moreTags", { count: project.technologies.length - 4 })}
            </span>
          )}
        </div>
      )}

      <div className="mt-3.5 flex items-center justify-between border-t pt-2.5 text-[11.5px]" style={{ borderColor: "var(--border)", color: "var(--text-faint)" }}>
        <StatusBadge status={project.status} locale={locale} />
        <div className="flex items-center gap-3">
          <span>
            {project.open_tasks} {t("projects.tasksCount")}
          </span>
          <span>
            {project.open_bugs} {t("projects.bugsCount")}
          </span>
        </div>
      </div>
    </Link>
  );
}
