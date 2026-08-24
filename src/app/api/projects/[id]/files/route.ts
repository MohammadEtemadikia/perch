import { NextRequest, NextResponse } from "next/server";
import { listProjectFiles, setProjectFiles } from "@/lib/queries";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(listProjectFiles(Number(id)));
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  if (!Array.isArray(body.files)) return NextResponse.json({ error: "files must be an array" }, { status: 400 });
  setProjectFiles(Number(id), body.files);
  return NextResponse.json({ ok: true });
}
