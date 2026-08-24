import Link from "next/link";
import { FolderKanban, Rocket, Code2, PauseCircle, Archive, PackageCheck, Bug, FileWarning, AlertTriangle, HeartPulse, Clock } from "lucide-react";
import { listProjects } from "@/lib/queries";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { HealthBadge, StatusBadge } from "@/components/badges";
import { getClaudeKnowledge } from "@/lib/queries";
import { getLocale, getServerT } from "@/lib/i18n/server";
import { intlLocale } from "@/lib/i18n/dictionaries";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  const locale = getLocale();
  const t = getServerT(locale);
  const projects = listProjects();

  const total = projects.length;
  const active = projects.filter((p) => p.status === "active").length;
  const inDevelopment = projects.filter((p) => p.status === "development" || p.status === "prototype").length;
  const paused = projects.filter((p) => p.status === "paused").length;
  const archived = projects.filter((p) => p.status === "archived").length;
  const production = projects.filter((p) => p.status === "production").length;
  const withIssues = projects.filter((p) => p.open_bugs > 0).length;
  const needsDocs = projects.filter((p) => {
    const k = getClaudeKnowledge(p.id);
    return (k?.documentation_score ?? 0) < 50;
  }).length;

  const healthCounts = {
    healthy: projects.filter((p) => p.health === "healthy").length,
    needs_attention: projects.filter((p) => p.health === "needs_attention").length,
    broken: projects.filter((p) => p.health === "broken").length,
    archived: projects.filter((p) => p.health === "archived").length,
    unknown: projects.filter((p) => p.health === "unknown").length,
  };

  const attention = projects
    .filter((p) => p.health === "broken" || p.health === "needs_attention")
    .slice(0, 6);

  const recentlyUpdated = [...projects]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 6);

  return (
    <div>
      <PageHeader title={t("dashboard.title")} subtitle={t("dashboard.subtitle")} />
      <div className="p-6">
        {total === 0 ? (
          <EmptyState locale={locale} />
        ) : (
          <>
            <div className="grid grid-cols-4 gap-3 xl:grid-cols-8">
              <StatCard label={t("dashboard.total")} value={total} icon={FolderKanban} accent="var(--text-muted)" />
              <StatCard label={t("dashboard.active")} value={active} icon={Rocket} accent="var(--success)" />
              <StatCard label={t("dashboard.development")} value={inDevelopment} icon={Code2} accent="var(--accent)" />
              <StatCard label={t("dashboard.paused")} value={paused} icon={PauseCircle} accent="var(--warning)" />
              <StatCard label={t("dashboard.archived")} value={archived} icon={Archive} accent="var(--text-faint)" />
              <StatCard label={t("dashboard.production")} value={production} icon={PackageCheck} accent="var(--success)" />
              <StatCard label={t("dashboard.withIssues")} value={withIssues} icon={Bug} accent="var(--danger)" />
              <StatCard label={t("dashboard.needsDocs")} value={needsDocs} icon={FileWarning} accent="var(--warning)" />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="col-span-2 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
                <div className="flex items-center gap-1.5 border-b px-4 py-3 text-[13px] font-semibold" style={{ borderColor: "var(--border)" }}>
                  <AlertTriangle size={14} style={{ color: "var(--warning)" }} /> {t("dashboard.needsAttention")}
                </div>
                {attention.length === 0 ? (
                  <div className="px-4 py-6 text-[12.5px]" style={{ color: "var(--text-faint)" }}>
                    {t("dashboard.nothingFlagged")}
                  </div>
                ) : (
                  <ul>
                    {attention.map((p) => (
                      <li key={p.id} className="border-b px-4 py-2.5 last:border-b-0" style={{ borderColor: "var(--border)" }}>
                        <Link href={`/projects/${p.slug}`} className="flex items-center justify-between">
                          <div>
                            <div className="text-[13px] font-medium">{p.name}</div>
                            <div className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>
                              {t("dashboard.openBugsTasks", {
                                bugs: p.open_bugs,
                                bugsSuffix: p.open_bugs === 1 ? "" : "s",
                                tasks: p.open_tasks,
                                tasksSuffix: p.open_tasks === 1 ? "" : "s",
                              })}
                            </div>
                          </div>
                          <HealthBadge health={p.health} locale={locale} />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
                <div className="flex items-center gap-1.5 border-b px-4 py-3 text-[13px] font-semibold" style={{ borderColor: "var(--border)" }}>
                  <HeartPulse size={14} style={{ color: "var(--success)" }} /> {t("dashboard.projectHealth")}
                </div>
                <div className="space-y-2.5 px-4 py-3.5">
                  {(Object.keys(healthCounts) as (keyof typeof healthCounts)[]).map((key) => (
                    <div key={key} className="flex items-center justify-between text-[12.5px]">
                      <HealthBadge health={key} locale={locale} />
                      <span style={{ color: "var(--text-muted)" }}>{healthCounts[key]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--bg-elevated)" }}>
              <div className="flex items-center gap-1.5 border-b px-4 py-3 text-[13px] font-semibold" style={{ borderColor: "var(--border)" }}>
                <Clock size={14} style={{ color: "var(--accent)" }} /> {t("dashboard.recentlyUpdated")}
              </div>
              <ul>
                {recentlyUpdated.map((p) => (
                  <li key={p.id} className="border-b px-4 py-2.5 last:border-b-0" style={{ borderColor: "var(--border)" }}>
                    <Link href={`/projects/${p.slug}`} className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[13px] font-medium">{p.name}</span>
                        <StatusBadge status={p.status} locale={locale} />
                      </div>
                      <span className="text-[11.5px]" style={{ color: "var(--text-faint)" }}>
                        {new Date(p.updated_at).toLocaleDateString(intlLocale(locale))}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ locale }: { locale: ReturnType<typeof getLocale> }) {
  const t = getServerT(locale);
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center" style={{ borderColor: "var(--border-strong)" }}>
      <div className="text-[14px] font-medium">{t("dashboard.noProjectsTitle")}</div>
      <p className="mt-1.5 max-w-sm text-[12.5px]" style={{ color: "var(--text-muted)" }}>
        {t("dashboard.noProjectsHint")}
      </p>
      <Link
        href="/projects?import=1"
        className="mt-4 rounded-md px-3.5 py-2 text-[12.5px] font-medium"
        style={{ background: "var(--accent)", color: "var(--accent-fg)" }}
      >
        {t("dashboard.importProject")}
      </Link>
    </div>
  );
}
