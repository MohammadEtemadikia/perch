import { NextRequest, NextResponse } from "next/server";
import { deleteProject, getProjectById, setProjectTags, updateProject } from "@/lib/queries";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProjectById(Number(id));
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const project = updateProject(Number(id), body);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (Array.isArray(body.tags)) setProjectTags(project.id, body.tags);
  return NextResponse.json(project);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  deleteProject(Number(id));
  return NextResponse.json({ ok: true });
}
