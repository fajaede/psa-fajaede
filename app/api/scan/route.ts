// app/api/scan/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const url = body?.url as string | undefined;

    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      return NextResponse.json(
        { error: "Invalid or missing URL. Use http(s)://…" },
        { status: 400 }
      );
    }

    // TODO: hier later jouw echte PSA-analyse (crawler + AI)
    const dummyResponse = {
      url,
      status: "ok",
      privacy: {
        score: "P2 / 3",
        note: "Basic tracking, clear privacy policy found.",
      },
      security: {
        score: "S3 / 3",
        note: "HTTPS enabled, modern TLS, no obvious issues.",
      },
      age: {
        score: "A1 / 3",
        note: "General audience; no explicit content detected.",
      },
      reportUrl: `https://psa.fajaede.nl/report/${encodeURIComponent(
        Buffer.from(url).toString("base64url")
      )}`,
    };

    return NextResponse.json(dummyResponse, { status: 200 });
  } catch (err) {
    console.error("PSA scan error:", err);
    return NextResponse.json(
      { error: "Internal PSA scan error. Please try again later." },
      { status: 500 }
    );
  }
}
