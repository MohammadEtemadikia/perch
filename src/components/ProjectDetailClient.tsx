"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Pencil, Archive, Trash2 } from "lucide-react";
import type { Bug, ChangelogEntry, ClaudeKnowledge, EnvVar, ImportantFile, Project, ScanRecord, Task, TechCategory } from "@/lib/types";
import type { GitInfo, GitLogEntry } from "@/lib/git";
import type { ScanReport } from "@/lib/scanner";
import { HealthBadge, StatusBadge } from "./badges";
import { useT } from "@/lib/i18n/provider";
import { ProjectActionButtons } from "./ActionButtons";
import { OverviewTab } from "./OverviewTab";
import { ArchitectureTab } from "./ArchitectureTab";
import { FilesTab } from "./FilesTab";
import { ClaudeKnowledgeTab } from "./ClaudeKnowledgeTab";
import { TasksTab } from "./TasksTab";
import { BugsTab } from "./BugsTab";
import { ChangelogTab } from "./ChangelogTab";
import { EnvironmentTab } from "./EnvironmentTab";
import { GitTab } from "./GitTab";
import { DocumentationTab } from "./DocumentationTab";
import { EditProjectModal } from "./EditProjectModal";
import { ConfirmDialog } from "./Modal";
import { useToast } from "./Toast";

const TABS = [
  { key: "Overview", labelKey: "detail.tabOverview" },
  { key: "Architecture", labelKey: "detail.tabArchitecture" },
  { key: "Files", labelKey: "detail.tabFiles" },
  { key: "Claude Knowledge", labelKey: "detail.tabClaudeKnowledge" },
  { key: "Documentation", labelKey: "detail.tabDocumentation" },
  { key: "Tasks", labelKey: "detail.tabTasks" },
  { key: "Bugs", labelKey: "detail.tabBugs" },
  { key: "Changelog", labelKey: "detail.tabChangelog" },
  { key: "Environment", labelKey: "detail.tabEnvironment" },
  { key: "Git", labelKey: "detail.tabGit" },
] as const;
type Tab = (typeof TABS)[number]["key"];

export function ProjectDetailClient({
  project,
  technologies,
  tags,
  envVars,
  files,
  tasks,
  bugs,
  changelog,
  knowledge,
  git,
  recentCommits,
  scan,
}: {
  project: Project;
  technologies: { name: string; category: TechCategory }[];
  tags: string[];
  envVars: EnvVar[];
  files: ImportantFile[];
  tasks: Task[];
  bugs: Bug[];
  changelog: ChangelogEntry[];
  knowledge: ClaudeKnowledge | null;
  git: GitInfo;
  recentCommits: GitLogEntry[];
  scan: ScanRecord | null;
}) {
  const { t, locale } = useT();
  const [tab, setTab] = useState<Tab>("Overview");
  const [editing, setEditing] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [scanning, setScanning] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const scanReport: ScanReport | null = scan ? JSON.parse(scan.report_json) : null;
  const runCommand = scanReport?.scripts?.dev ? "npm run dev" : scanReport?.scripts?.start ? "npm start" : null;

  async function rescan() {
    setScanning(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/scan`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.push(data.error ?? t("detail.scanFailed"), "error");
        return;
      }
      toast.push(t("detail.scanComplete"), "success");
      router.refresh();
    } finally {
      setScanning(false);
    }
  }

  async function archive() {
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived", health_is_manual: 1, health: "archived" }),
    });
    toast.push(t("detail.archivedToast"), "success");
    setArchiving(false);
    router.refresh();
  }

  async function deleteProject() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.push(t("detail.deletedToast"), "success");
      router.push("/projects");
    } catch {
      toast.push(t("detail.deleteError"), "error");
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

  return (
    <div>
      <div className="border-b px-6 py-4" style={{ borderColor: "var(--border)" }}>
        <Link href="/projects" className="mb-2 flex items-center gap-1 text-[12px]" style={{ color: "var(--text-faint)" }}>
          <ArrowLeft size={13} /> {t("detail.allProjects")}
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-[18px] font-semibold tracking-tight">{project.name}</h1>
              <StatusBadge status={project.status} locale={locale} />
              <HealthBadge health={project.health} locale={locale} />
              {project.version && (
                <span className="text-[12px]" style={{ color: "var(--text-faint)" }}>
                  v{project.version}
                </span>
              )}
            </div>
            {project.description && (
              <p className="mt-1 max-w-2xl text-[12.5px]" style={{ color: "var(--text-muted)" }}>
                {project.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={rescan} disabled={scanning || !project.local_path} title={!project.local_path ? t("detail.noLocalPath") : t("detail.rescanTooltip")} className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-medium disabled:opacity-40" style={{ borderColor: "var(--border-strong)" }}>
              <RefreshCw size={13} className={scanning ? "animate-spin" : ""} /> {scanning ? t("detail.rescanning") : t("detail.rescan")}
            </button>
            <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-medium" style={{ borderColor: "var(--border-strong)" }}>
              <Pencil size={13} /> {t("detail.edit")}
            </button>
            <button onClick={() => setArchiving(true)} className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-medium" style={{ borderColor: "var(--border-strong)" }}>
              <Archive size={13} /> {t("detail.archive")}
            </button>
            <button
              onClick={() => setConfirmingDelete(true)}
              className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-medium"
              style={{ borderColor: "var(--border-strong)", color: "var(--danger)" }}
            >
              <Trash2 size={13} /> {t("detail.delete")}
            </button>
          </div>
        </div>
        <div className="mt-3">
          <ProjectActionButtons localPath={project.local_path} gitRemoteUrl={project.git_remote_url ?? git.remoteUrl} runCommand={runCommand} />
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b px-6" style={{ borderColor: "var(--border)" }}>
        {TABS.map(({ key, labelKey }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="whitespace-nowrap border-b-2 px-2.5 py-2.5 text-[12.5px] font-medium"
            style={{ borderColor: tab === key ? "var(--accent)" : "transparent", color: tab === key ? "var(--text)" : "var(--text-muted)" }}
          >
            {t(labelKey)}
            {key === "Tasks" && tasks.length > 0 && <sup className="ms-1" style={{ color: "var(--text-faint)" }}>{tasks.filter((x) => x.status !== "done").length}</sup>}
            {key === "Bugs" && bugs.length > 0 && <sup className="ms-1" style={{ color: "var(--text-faint)" }}>{bugs.filter((x) => x.status === "open").length}</sup>}
          </button>
        ))}
      </div>

      <div className="p-6">
        {tab === "Overview" && <OverviewTab project={project} technologies={technologies} tags={tags} />}
        {tab === "Architecture" && <ArchitectureTab technologies={technologies} />}
        {tab === "Files" && <FilesTab projectId={project.id} files={files} topLevelDirs={scanReport?.topLevelDirs ?? []} />}
        {tab === "Claude Knowledge" && <ClaudeKnowledgeTab projectId={project.id} knowledge={knowledge} />}
        {tab === "Documentation" && <DocumentationTab projectId={project.id} documentationScore={knowledge?.documentation_score ?? null} />}
        {tab === "Tasks" && <TasksTab projectId={project.id} tasks={tasks} />}
        {tab === "Bugs" && <BugsTab projectId={project.id} bugs={bugs} />}
        {tab === "Changelog" && <ChangelogTab projectId={project.id} entries={changelog} hasGit={git.isRepo} />}
        {tab === "Environment" && <EnvironmentTab envVars={envVars} />}
        {tab === "Git" && <GitTab git={git} recentCommits={recentCommits} />}
      </div>

      {editing && <EditProjectModal project={project} tags={tags} onClose={() => setEditing(false)} />}
      {archiving && (
        <ConfirmDialog
          title={t("detail.archiveTitle")}
          message={t("detail.archiveMessage")}
          confirmLabel={t("detail.archive")}
          onConfirm={archive}
          onCancel={() => setArchiving(false)}
        />
      )}
      {confirmingDelete && (
        <ConfirmDialog
          title={t("detail.deleteTitle")}
          message={t("detail.deleteMessage", { name: project.name })}
          confirmLabel={deleting ? t("detail.deleting") : t("detail.delete")}
          danger
          onConfirm={deleteProject}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}
