import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getProjectById } from "@/lib/queries";
import { getGitInfo } from "@/lib/git";
import { buildGenContext, generateDoc, GENERATABLE_DOCS, type GeneratableDoc } from "@/lib/docGenerator";
import { db } from "@/lib/db";

/** Produces a preview (proposed content + current content if any) — writes nothing. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProjectById(Number(id));
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!project.local_path) {
    return NextResponse.json({ error: "This project has no local path set." }, { status: 400 });
  }

  const body = await req.json();
  const requested: GeneratableDoc[] = Array.isArray(body.docs) && body.docs.length > 0 ? body.docs : [...GENERATABLE_DOCS];

  const technologies = db
    .prepare(
      `SELECT te.name, te.category FROM project_technologies pt JOIN technologies te ON te.id = pt.technology_id WHERE pt.project_id = ?`
    )
    .all(project.id) as { name: string; category: string }[];
  const git = getGitInfo(project.local_path);
  const ctx = buildGenContext(project, technologies, git);

  const previews = requested
    .filter((d): d is GeneratableDoc => (GENERATABLE_DOCS as readonly string[]).includes(d))
    .map((docName) => {
      const filePath = path.join(project.local_path!, docName);
      const exists = fs.existsSync(filePath);
      const currentContent = exists ? fs.readFileSync(filePath, "utf8") : null;
      const proposedContent = generateDoc(docName, ctx);
      return { name: docName, path: filePath, exists, currentContent, proposedContent, unchanged: currentContent === proposedContent };
    });

  return NextResponse.json({ previews });
}
