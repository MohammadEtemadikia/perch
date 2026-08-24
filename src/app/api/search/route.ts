import { NextRequest, NextResponse } from "next/server";
import { globalSearch } from "@/lib/queries";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json([]);
  return NextResponse.json(globalSearch(q));
}
