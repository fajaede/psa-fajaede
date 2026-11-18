import { signedDirectory } from "@/lib/web-bot-auth";

export const dynamic = "force-dynamic";

// Public key of FajaedeScan for Web Bot Auth (Cloudflare verified bots / signed agents).
export async function GET(request: Request) {
  const host = request.headers.get("host") ?? "psa.fajaede.nl";
  const directory = signedDirectory(host);
  if (!directory) return new Response("Not found", { status: 404 });
  return new Response(directory.body, { headers: directory.headers });
}
