import { NextRequest, NextResponse } from "next/server";
import { getProjectById, getSetting } from "@/lib/queries";
import { suggestPath } from "@/lib/organization";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const project = getProjectById(Number(projectId));
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  const orgRoot = getSetting("organization_root");
  if (!orgRoot) return NextResponse.json({ error: "Set an organization root folder in Settings first." }, { status: 400 });
  return NextResponse.json({ suggested: suggestPath(orgRoot, project) });
}
