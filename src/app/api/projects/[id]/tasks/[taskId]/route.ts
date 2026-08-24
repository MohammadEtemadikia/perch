import { NextRequest, NextResponse } from "next/server";
import { deleteTask, updateTask } from "@/lib/queries";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  const body = await req.json();
  const task = updateTask(Number(taskId), body);
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ taskId: string }> }) {
  const { taskId } = await params;
  deleteTask(Number(taskId));
  return NextResponse.json({ ok: true });
}
