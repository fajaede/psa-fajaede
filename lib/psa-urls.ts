const productionPsaUrl = "https://psa.fajaede.nl";

const isPreview = () => process.env.VERCEL_ENV === "preview";

export function getPsaAppUrl(requestUrl: string): string {
  const configuredUrl = process.env.PSA_APP_URL?.trim();
  // On a Vercel preview, use the preview's own (stable branch) URL so Mollie returns there
  // instead of the live site. Production keeps psa.fajaede.nl.
  const previewUrl = isPreview() && process.env.VERCEL_BRANCH_URL
    ? `https://${process.env.VERCEL_BRANCH_URL}`
    : "";
  const baseUrl = configuredUrl || previewUrl || (process.env.NODE_ENV === "development"
    ? new URL(requestUrl).origin
    : productionPsaUrl);

  return baseUrl.replace(/\/+$/, "");
}

// PSA handles its own Mollie webhooks; it no longer routes through WordPress.
export function getMollieWebhookUrl(baseUrl: string): string {
  const url = `${baseUrl}/api/premium/webhook`;
  // Previews sit behind Vercel Authentication: Mollie can only reach the webhook with the
  // "Protection Bypass for Automation" secret (set by Vercel when that option is enabled).
  const bypass = isPreview() ? process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() : "";
  return bypass ? `${url}?x-vercel-protection-bypass=${encodeURIComponent(bypass)}` : url;
}
