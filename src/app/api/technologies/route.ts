import { NextResponse } from "next/server";
import { listAllTechnologies } from "@/lib/queries";

export async function GET() {
  return NextResponse.json(listAllTechnologies());
}
