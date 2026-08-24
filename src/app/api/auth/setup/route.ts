import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, createSessionToken, isAuthConfigured, setAuthMethod, setPassword } from "@/lib/auth";

// Only handles the two self-contained methods. "github"/"google" are finalized by
// /api/auth/oauth/[provider]/callback instead, once a real token exchange succeeds —
// never on the client's unverified say-so.
export async function POST(req: NextRequest) {
  if (isAuthConfigured()) return NextResponse.json({ error: "already configured" }, { status: 400 });

  const body = await req.json();
  const method = body.method;

  if (method === "password") {
    if (typeof body.password !== "string" || body.password.length < 4) {
      return NextResponse.json({ error: "Password must be at least 4 characters." }, { status: 400 });
    }
    setPassword(body.password);
  } else if (method === "none") {
    setAuthMethod("none");
  } else {
    return NextResponse.json({ error: "Unknown method" }, { status: 400 });
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
