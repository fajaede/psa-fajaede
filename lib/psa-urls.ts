const productionPsaUrl = "https://psa.fajaede.nl";

export function getPsaAppUrl(requestUrl: string): string {
  const configuredUrl = process.env.PSA_APP_URL?.trim();
  const baseUrl = configuredUrl || (process.env.NODE_ENV === "development"
    ? new URL(requestUrl).origin
    : productionPsaUrl);

  return baseUrl.replace(/\/+$/, "");
}

// PSA handles its own Mollie webhooks; it no longer routes through WordPress.
export function getMollieWebhookUrl(baseUrl: string): string {
  return `${baseUrl}/api/premium/webhook`;
}