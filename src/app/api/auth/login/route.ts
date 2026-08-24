import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, createSessionToken, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (typeof body.password !== "string" || !verifyPassword(body.password)) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return res;
}
