import { NextRequest, NextResponse } from "next/server";
import { getScanRoots, setScanRoots, getSetting, setSetting } from "@/lib/queries";
import { getDbPath } from "@/lib/db";

export async function GET() {
  return NextResponse.json({
    scanRoots: getScanRoots(),
    organizationRoot: getSetting("organization_root") ?? "",
    dbPath: getDbPath(),
    locale: getSetting("locale") ?? "en",
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  if (body.scanRoots !== undefined) {
    if (!Array.isArray(body.scanRoots)) return NextResponse.json({ error: "scanRoots must be an array" }, { status: 400 });
    setScanRoots(body.scanRoots);
  }
  if (body.organizationRoot !== undefined) {
    setSetting("organization_root", String(body.organizationRoot));
  }
  if (body.locale !== undefined) {
    if (body.locale !== "en" && body.locale !== "fa" && body.locale !== "nl") return NextResponse.json({ error: "locale must be 'en', 'fa', or 'nl'" }, { status: 400 });
    setSetting("locale", body.locale);
  }
  return NextResponse.json({ ok: true });
}
