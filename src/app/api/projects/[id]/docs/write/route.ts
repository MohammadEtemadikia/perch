import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getProjectById } from "@/lib/queries";
import { db } from "@/lib/db";
import { GENERATABLE_DOCS, type GeneratableDoc } from "@/lib/docGenerator";

/**
 * Writes one generated doc to disk. Requires the caller to have already seen
 * the preview from /docs/generate and to explicitly confirm — if the file
 * exists and `overwrite` is not true, this refuses rather than silently
 * clobbering existing documentation.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProjectById(Number(id));
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!project.local_path) return NextResponse.json({ error: "This project has no local path set." }, { status: 400 });

  const body = await req.json();
  const name = body.name as GeneratableDoc;
  const content = body.content as string;
  const overwrite = Boolean(body.overwrite);

  if (!(GENERATABLE_DOCS as readonly string[]).includes(name) || typeof content !== "string") {
    return NextResponse.json({ error: "Invalid doc name or content." }, { status: 400 });
  }

  const filePath = path.join(project.local_path, name);
  const exists = fs.existsSync(filePath);
  if (exists && !overwrite) {
    return NextResponse.json({ error: "File exists — pass overwrite:true after showing the user a diff." }, { status: 409 });
  }

  fs.writeFileSync(filePath, content, "utf8");
  db.prepare(`INSERT INTO doc_generations (project_id, doc_name, action) VALUES (?, ?, ?)`).run(
    project.id,
    name,
    exists ? "updated" : "created"
  );

  return NextResponse.json({ ok: true, action: exists ? "updated" : "created", path: filePath });
}
