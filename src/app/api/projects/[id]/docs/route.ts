import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getClaudeKnowledge, getProjectById, upsertClaudeKnowledge } from "@/lib/queries";
import { GENERATABLE_DOCS } from "@/lib/docGenerator";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProjectById(Number(id));
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });

  const knowledge = getClaudeKnowledge(project.id) ?? null;
  const docs = GENERATABLE_DOCS.map((name) => {
    const exists = project.local_path ? fs.existsSync(path.join(project.local_path, name)) : false;
    return { name, exists };
  });

  return NextResponse.json({ knowledge, docs, hasLocalPath: Boolean(project.local_path) });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProjectById(Number(id));
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = await req.json();
  const knowledge = upsertClaudeKnowledge(project.id, body);
  return NextResponse.json(knowledge);
}
