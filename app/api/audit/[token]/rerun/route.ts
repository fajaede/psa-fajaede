import { NextResponse } from "next/server";
import { rerunOrderAudit } from "@/lib/site-audit-api";

// "Opnieuw controleren" on the private audit page; the secret token is the access check.
export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!/^[a-f0-9]{32}$/.test(token)) return NextResponse.json({ error: "Audit niet gevonden." }, { status: 404 });
  const result = await rerunOrderAudit(token);
  return result.ok
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: result.reason }, { status: 409 });
}
