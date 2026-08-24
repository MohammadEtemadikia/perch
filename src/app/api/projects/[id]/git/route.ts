import { NextRequest, NextResponse } from "next/server";
import { getProjectById } from "@/lib/queries";
import { getGitInfo, getRecentCommits } from "@/lib/git";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = getProjectById(Number(id));
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  const info = getGitInfo(project.local_path);
  const commits = getRecentCommits(project.local_path, 20);
  return NextResponse.json({ ...info, recentCommits: commits });
}
