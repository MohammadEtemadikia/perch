import { NextRequest, NextResponse } from "next/server";
import { getProjectById, updateProject } from "@/lib/queries";
import { buildMovePlan, performMove } from "@/lib/organization";

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.confirm !== true) {
    return NextResponse.json({ error: "Explicit confirm:true is required to perform a move." }, { status: 400 });
  }
  const project = getProjectById(Number(body.projectId));
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });

  const plan = buildMovePlan(project, body.destination);
  if (!plan.canProceed) {
    return NextResponse.json({ error: "Dry-run checks failed — refusing to move.", plan }, { status: 409 });
  }

  const result = performMove(project, body.destination);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 500 });

  updateProject(project.id, { local_path: result.newPath });
  return NextResponse.json({ ok: true, newPath: result.newPath });
}
