import { NextRequest, NextResponse } from "next/server";
import { getProjectById } from "@/lib/queries";
import { buildMovePlan } from "@/lib/organization";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const project = getProjectById(Number(body.projectId));
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  const plan = buildMovePlan(project, body.destination);
  return NextResponse.json(plan);
}
