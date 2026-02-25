import { NextResponse } from "next/server";

type Site = {
  id: string;
  url: string;
  score: number;
};

export async function GET() {
  const sites: Site[] = [
    { id: "1", url: "https://www.fajaede.nl", score: 92 },
    { id: "2", url: "https://psa.fajaede.nl", score: 88 },
  ];

  return NextResponse.json(sites, { status: 200 });
}
