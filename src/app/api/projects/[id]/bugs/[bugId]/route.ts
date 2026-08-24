import { NextRequest, NextResponse } from "next/server";
import { deleteBug, updateBug } from "@/lib/queries";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ bugId: string }> }) {
  const { bugId } = await params;
  const body = await req.json();
  const bug = updateBug(Number(bugId), body);
  if (!bug) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(bug);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ bugId: string }> }) {
  const { bugId } = await params;
  deleteBug(Number(bugId));
  return NextResponse.json({ ok: true });
}
