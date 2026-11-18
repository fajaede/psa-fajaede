// Web Bot Auth for FajaedeScan: signed requests so Cloudflare can verify our scanner.
// Same profile and key as fajaede.eu backend/web_bot_auth.py ("scan" identity):
// - Ed25519; keyid = JWK thumbprint (RFC 7638/8037), base64url without padding
// - covers "@authority" and "signature-agent"; tag "web-bot-auth"; 60 s expiry; nonce
// - public key directory: https://psa.fajaede.nl/.well-known/http-message-signatures-directory
// The key (WEB_BOT_AUTH_SCAN_KEY) is a random 32-byte Ed25519 seed, base64url. Without it nothing is signed.
import { createHash, createPrivateKey, createPublicKey, randomBytes, sign, type KeyObject } from "node:crypto";

export const SIGNATURE_AGENT = "https://psa.fajaede.nl";
export const DIRECTORY_CONTENT_TYPE = "application/http-message-signatures-directory+json";
const LIFETIME_SECONDS = 60;
// PKCS#8 DER prefix for a raw 32-byte Ed25519 private key.
const PKCS8_ED25519_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");

type Jwk = { kty: "OKP"; crv: "Ed25519"; x: string };

const b64url = (data: Buffer) => data.toString("base64url");

function privateKey(): KeyObject | null {
  const seed = process.env.WEB_BOT_AUTH_SCAN_KEY?.trim();
  if (!seed) return null;
  const raw = Buffer.from(seed, "base64url");
  if (raw.length !== 32) {
    console.warn("WEB_BOT_AUTH_SCAN_KEY must be a 32-byte base64url seed; requests are not signed.");
    return null;
  }
  return createPrivateKey({ key: Buffer.concat([PKCS8_ED25519_PREFIX, raw]), format: "der", type: "pkcs8" });
}

export function publicJwk(key: KeyObject): Jwk {
  const jwk = createPublicKey(key).export({ format: "jwk" }) as { x: string };
  return { kty: "OKP", crv: "Ed25519", x: jwk.x };
}

/** RFC 7638 thumbprint: SHA-256 of the required members in lexicographic order. */
export function thumbprint(jwk: Jwk): string {
  return b64url(createHash("sha256").update(JSON.stringify({ crv: jwk.crv, kty: jwk.kty, x: jwk.x })).digest());
}

export function authority(url: string): string {
  const u = new URL(url);
  return u.port ? `${u.hostname.toLowerCase()}:${u.port}` : u.hostname.toLowerCase();   // URL drops default ports
}

function params(components: string, keyid: string, tag: string, created: number): string {
  return `(${components});created=${created};keyid="${keyid}";alg="ed25519";expires=${created + LIFETIME_SECONDS}`
    + `;nonce="${b64url(randomBytes(32))}";tag="${tag}"`;
}

/** Headers that sign a request to `url` as FajaedeScan; {} without a key. */
export function signRequest(url: string, now = Math.floor(Date.now() / 1000)): Record<string, string> {
  const key = privateKey();
  if (!key) return {};
  const agent = `"${SIGNATURE_AGENT}"`;
  const p = params('"@authority" "signature-agent"', thumbprint(publicJwk(key)), "web-bot-auth", now);
  const base = `"@authority": ${authority(url)}\n"signature-agent": ${agent}\n"@signature-params": ${p}`;
  const signature = sign(null, Buffer.from(base, "ascii"), key).toString("base64");
  return { "Signature-Agent": agent, "Signature-Input": `sig1=${p}`, Signature: `sig1=:${signature}:` };
}

/** The signed key directory served on `host`; null without a key. */
export function signedDirectory(host: string, now = Math.floor(Date.now() / 1000)): { body: string; headers: Record<string, string> } | null {
  const key = privateKey();
  if (!key) return null;
  const jwk = publicJwk(key);
  const p = params('"@authority";req', thumbprint(jwk), "http-message-signatures-directory", now);
  const base = `"@authority";req: ${host.toLowerCase()}\n"@signature-params": ${p}`;
  const signature = sign(null, Buffer.from(base, "ascii"), key).toString("base64");
  return {
    body: JSON.stringify({ keys: [jwk] }),
    headers: {
      "Content-Type": DIRECTORY_CONTENT_TYPE,
      "Signature-Input": `sig1=${p}`,
      Signature: `sig1=:${signature}:`,
      "Cache-Control": "public, max-age=3600",
    },
  };
}
