import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Stuur de vraag én de gevonden websites naar je Python API op Hetzner
    const response = await fetch("http://116.203.39.166:18000/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("AI Bridge Error:", error);
    return NextResponse.json({ error: "AI verbinding mislukt" }, { status: 500 });
  }
}