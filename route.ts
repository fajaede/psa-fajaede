import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ hits: [] });
  }

  const MEILISEARCH_HOST = process.env.MEILISEARCH_HOST || "http://116.203.39.166:7700";
  const MEILISEARCH_API_KEY = process.env.MEILISEARCH_API_KEY || "Fajaede_Secure_Meili_Key_928374!";
  const INDEX_NAME = process.env.MEILISEARCH_INDEX || "pages";

  try {
    const res = await fetch(`${MEILISEARCH_HOST}/indexes/${INDEX_NAME}/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${MEILISEARCH_API_KEY}`
      },
      body: JSON.stringify({
        q: query,
        limit: 20
      })
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Meilisearch integratie fout:", error);
    return NextResponse.json({ error: "Kan geen verbinding maken met de Hetzner zoekmachine." }, { status: 500 });
  }
}