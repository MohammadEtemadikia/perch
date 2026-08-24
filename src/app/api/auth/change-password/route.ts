import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, getAuthMethod, removePassword, setPassword, verifyPassword, verifySessionToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const method = getAuthMethod();
  if (method !== "none" && !verifySessionToken(req.cookies.get(SESSION_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const body = await req.json();

  if (method === "password") {
    if (typeof body.currentPassword !== "string" || !verifyPassword(body.currentPassword)) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });
    }
  }

  if (body.newPassword === null) {
    removePassword();
    return NextResponse.json({ ok: true });
  }

  if (typeof body.newPassword !== "string" || body.newPassword.length < 4) {
    return NextResponse.json({ error: "New password must be at least 4 characters." }, { status: 400 });
  }
  setPassword(body.newPassword);
  return NextResponse.json({ ok: true });
}
