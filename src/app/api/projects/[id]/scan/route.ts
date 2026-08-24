import { NextRequest, NextResponse } from "next/server";
import { computeHealth, scanProjectFolder } from "@/lib/scanner";
import {
  getProjectById,
  recordScan,
  setProjectEnvVars,
  setProjectTechnologies,
  updateProject,
  upsertClaudeKnowledge,
} from "@/lib/queries";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProjectById(Number(id));
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!project.local_path) {
    return NextResponse.json({ error: "This project has no local path set, nothing to scan." }, { status: 400 });
  }

  const report = scanProjectFolder(project.local_path);
  const computed = report.exists && !report.error ? computeHealth(report) : "broken";

  setProjectTechnologies(
    project.id,
    report.technologies.map((t) => ({ name: t.name, category: t.category, detail: t.detail }))
  );
  setProjectEnvVars(
    project.id,
    report.envVars.map((v) => ({ name: v.name, status: v.status, is_public: v.isPublic }))
  );
  upsertClaudeKnowledge(project.id, {
    has_claude_md: report.hasClaudeMd ? 1 : 0,
    has_readme: report.hasReadme ? 1 : 0,
    documentation_score: report.documentationScore,
  });

  if (!project.health_is_manual) {
    updateProject(project.id, { health: computed });
  }
  if (report.git.isRepo && report.git.remoteUrl && !project.git_remote_url) {
    updateProject(project.id, { git_remote_url: report.git.remoteUrl });
  }
  if (report.name && !project.description && report.description) {
    updateProject(project.id, { description: report.description });
  }

  const scan = recordScan(project.id, JSON.stringify(report), computed, report.recommendedActions);

  return NextResponse.json({ scan, report, computedHealth: computed });
}
