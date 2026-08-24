import { NextRequest, NextResponse } from "next/server";
import { createTask, listProjectTasks } from "@/lib/queries";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json(listProjectTasks(Number(id)));
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  if (!body.title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  const task = createTask({ ...body, project_id: Number(id) });
  return NextResponse.json(task, { status: 201 });
}
