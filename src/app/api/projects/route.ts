import { NextRequest, NextResponse } from "next/server";
import { createProject, listProjects, setProjectTags } from "@/lib/queries";

export async function GET() {
  return NextResponse.json(listProjects());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const project = createProject(body);
  if (Array.isArray(body.tags)) setProjectTags(project.id, body.tags);
  return NextResponse.json(project, { status: 201 });
}
