import { NextRequest, NextResponse } from "next/server";
import { getProjectById } from "@/lib/queries";
import { getGitInfo } from "@/lib/git";
import { explainProject } from "@/lib/explainer";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProjectById(Number(id));
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  const technologies = db
    .prepare(`SELECT te.name, te.category FROM project_technologies pt JOIN technologies te ON te.id = pt.technology_id WHERE pt.project_id = ?`)
    .all(project.id) as { name: string; category: string }[];
  const git = getGitInfo(project.local_path);
  return NextResponse.json(explainProject(project, technologies, git));
}
