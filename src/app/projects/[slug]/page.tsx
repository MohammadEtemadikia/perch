import { notFound } from "next/navigation";
import {
  getProjectBySlug,
  listProjectEnvVars,
  listProjectFiles,
  listProjectTasks,
  listProjectBugs,
  listProjectChangelog,
  getClaudeKnowledge,
  latestScan,
} from "@/lib/queries";
import { db } from "@/lib/db";
import { getGitInfo, getRecentCommits } from "@/lib/git";
import { ProjectDetailClient } from "@/components/ProjectDetailClient";
import type { TechCategory } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const technologies = db
    .prepare(
      `SELECT te.name, te.category FROM project_technologies pt JOIN technologies te ON te.id = pt.technology_id WHERE pt.project_id = ?`
    )
    .all(project.id) as { name: string; category: TechCategory }[];

  const tags = db
    .prepare(`SELECT tg.name FROM project_tags pt JOIN tags tg ON tg.id = pt.tag_id WHERE pt.project_id = ?`)
    .all(project.id) as { name: string }[];

  const envVars = listProjectEnvVars(project.id);
  const files = listProjectFiles(project.id);
  const tasks = listProjectTasks(project.id);
  const bugs = listProjectBugs(project.id);
  const changelog = listProjectChangelog(project.id);
  const knowledge = getClaudeKnowledge(project.id) ?? null;
  const git = getGitInfo(project.local_path);
  const recentCommits = getRecentCommits(project.local_path, 20);
  const scan = latestScan(project.id);

  return (
    <ProjectDetailClient
      project={project}
      technologies={technologies}
      tags={tags.map((t) => t.name)}
      envVars={envVars}
      files={files}
      tasks={tasks}
      bugs={bugs}
      changelog={changelog}
      knowledge={knowledge}
      git={git}
      recentCommits={recentCommits}
      scan={scan ?? null}
    />
  );
}
