import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { accountantEmail, buildCsv, collectRows, maybeSendWeeklyReport, sendReport } from "@/lib/accounting-report";

// Vercel Cron calls this daily with "Authorization: Bearer $CRON_SECRET"; the report itself
// goes out once per week from Thursday on. Manual use with the same header:
//   ?days=7&download=1  -> CSV of the last N days
//   ?days=7&send=1      -> email that CSV to ACCOUNTANT_EMAIL now (does not affect the schedule)
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  if (params.has("download") || params.has("send")) {
    const days = Math.max(1, Math.min(Number(params.get("days") ?? 7) || 7, 400));
    const until = new Date();
    const since = new Date(until.getTime() - days * 86400000);

    if (params.has("send")) {
      const recipient = accountantEmail();
      if (!recipient) return NextResponse.json({ error: "ACCOUNTANT_EMAIL is niet ingesteld." }, { status: 400 });
      const sales = await sendReport(since, until, recipient);
      return NextResponse.json({ sent: true, sales, days });
    }

    return new Response(buildCsv(await collectRows(since, until)), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="psa-fajaede-verkopen-${days}d.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const result = await maybeSendWeeklyReport();
  return NextResponse.json({ result }, { status: result === "failed" ? 500 : 200 });
}
