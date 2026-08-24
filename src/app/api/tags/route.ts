import { NextResponse } from "next/server";
import { listAllTags } from "@/lib/queries";

export async function GET() {
  return NextResponse.json(listAllTags());
}
