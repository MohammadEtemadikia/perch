import { NextRequest, NextResponse } from "next/server";
import { scanProjectFolder, computeHealth } from "@/lib/scanner";
import { createProject, getProjectBySlug, recordScan, setProjectEnvVars, setProjectTechnologies, slugify, upsertClaudeKnowledge } from "@/lib/queries";

/** Scans an arbitrary folder without creating a project — powers "Import Existing Project". */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const targetPath = body.path as string;
  if (!targetPath || typeof targetPath !== "string") {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }

  const report = scanProjectFolder(targetPath);
  if (!report.exists) return NextResponse.json({ report }, { status: 200 });

  if (body.createProject) {
    const existingSlug = getProjectBySlug(slugify(report.name ?? targetPath));
    if (existingSlug && existingSlug.local_path === targetPath) {
      return NextResponse.json({ error: "This folder is already imported as a project.", project: existingSlug }, { status: 409 });
    }
    const project = createProject({
      name: report.name ?? targetPath.split("/").pop() ?? "Untitled project",
      description: report.description,
      local_path: targetPath,
      status: "development",
      health: report.error ? "broken" : computeHealth(report),
    });
    setProjectTechnologies(project.id, report.technologies.map((t) => ({ name: t.name, category: t.category, detail: t.detail })));
    setProjectEnvVars(project.id, report.envVars.map((v) => ({ name: v.name, status: v.status, is_public: v.isPublic })));
    upsertClaudeKnowledge(project.id, {
      has_claude_md: report.hasClaudeMd ? 1 : 0,
      has_readme: report.hasReadme ? 1 : 0,
      documentation_score: report.documentationScore,
    });
    recordScan(project.id, JSON.stringify(report), computeHealth(report), report.recommendedActions);
    return NextResponse.json({ report, project }, { status: 201 });
  }

  return NextResponse.json({ report });
}
