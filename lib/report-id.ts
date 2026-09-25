const REPORT_PREFIX = "PSA-";
const REPORT_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeReportId(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return REPORT_PREFIX;

  const upper = trimmed.toUpperCase();
  if (/^PSA-[A-Z0-9]{6,}$/.test(upper)) {
    return upper;
  }

  return trimmed;
}

export function generateReportId(): string {
  const chars: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    chars.push(REPORT_ALPHABET[Math.floor(Math.random() * REPORT_ALPHABET.length)]);
  }
  return `${REPORT_PREFIX}${chars.join("")}`;
}

export function buildReportPath(id: string): string {
  return `/report/${normalizeReportId(id)}`;
}

export function buildVerifyPath(id: string): string {
  return `/verify/${normalizeReportId(id)}`;
}
