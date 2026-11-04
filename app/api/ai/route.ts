import { NextRequest, NextResponse } from "next/server";

const MAX_REQUEST_BYTES = 32_000;
const MAX_RESPONSE_BYTES = 128_000;

async function readLimitedStream(stream: ReadableStream<Uint8Array> | null, maxBytes: number): Promise<string> {
  if (!stream) return "";
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let bytesRead = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > maxBytes) {
        await reader.cancel();
        throw new Error("Request body exceeds configured limit");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(bytesRead);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

export async function POST(request: NextRequest) {
  try {
    const declaredLength = Number(request.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: "AI request is too large" }, { status: 413 });
    }

    let rawBody: string;
    try {
      rawBody = await readLimitedStream(request.body, MAX_REQUEST_BYTES);
    } catch {
      return NextResponse.json({ error: "AI request is too large" }, { status: 413 });
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Expected a JSON object" }, { status: 400 });
    }

    const configuredUrl = process.env.EUROPEAN_SEARCH_AI_URL;
    if (!configuredUrl) {
      return NextResponse.json({ error: "AI service is not configured" }, { status: 503 });
    }

    let upstreamUrl: URL;
    try {
      upstreamUrl = new URL(configuredUrl);
    } catch {
      return NextResponse.json({ error: "AI service URL is invalid" }, { status: 500 });
    }
    const isLocalDevelopment = process.env.NODE_ENV === "development"
      && ["localhost", "127.0.0.1", "::1"].includes(upstreamUrl.hostname);
    if (upstreamUrl.protocol !== "https:" && !isLocalDevelopment) {
      return NextResponse.json({ error: "AI service must use HTTPS" }, { status: 500 });
    }

    const response = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: rawBody,
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "AI service request failed" }, { status: 502 });
    }
    let responseText: string;
    try {
      responseText = await readLimitedStream(response.body, MAX_RESPONSE_BYTES);
    } catch {
      return NextResponse.json({ error: "AI service response is too large" }, { status: 502 });
    }
    let data: unknown;
    try {
      data = JSON.parse(responseText);
    } catch {
      return NextResponse.json({ error: "AI service returned invalid JSON" }, { status: 502 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("AI bridge failed:", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ error: "AI verbinding mislukt" }, { status: 500 });
  }
}