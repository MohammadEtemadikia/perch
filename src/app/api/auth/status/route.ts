import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getAuthMethod, isAuthConfigured, verifySessionToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const configured = isAuthConfigured();
  const method = getAuthMethod();
  const authenticated = configured && method !== "none" ? verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value) : configured;
  return NextResponse.json({ configured, method, authenticated });
}
