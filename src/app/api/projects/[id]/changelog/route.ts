import { NextRequest, NextResponse } from "next/server";
import { addChangelogEntries, getProjectById, listProjectChangelog } from "@/lib/queries";
import { getRecentCommits } from "@/lib/git";
import { db } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(listProjectChangelog(Number(id)));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = Number(id);
  const project = getProjectById(projectId);
  if (!project) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = await req.json();

  if (body.action === "import_from_git") {
    const commits = getRecentCommits(project.local_path, 50);
    const existingShas = new Set(
      (db.prepare(`SELECT commit_sha FROM changelog_entries WHERE project_id = ? AND commit_sha IS NOT NULL`).all(projectId) as { commit_sha: string }[]).map(
        (r) => r.commit_sha
      )
    );
    const fresh = commits.filter((c) => !existingShas.has(c.sha));
    addChangelogEntries(
      projectId,
      fresh.map((c) => ({
        summary: c.message,
        entry_date: c.date,
        source: "git" as const,
        commit_sha: c.sha,
      }))
    );
    return NextResponse.json({ imported: fresh.length });
  }

  if (!body.summary) return NextResponse.json({ error: "summary is required" }, { status: 400 });
  addChangelogEntries(projectId, [
    { summary: body.summary, version: body.version ?? null, entry_date: body.entry_date ?? new Date().toISOString(), source: "manual" },
  ]);
  return NextResponse.json({ ok: true }, { status: 201 });
}
