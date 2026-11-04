const productionPsaUrl = "https://psa.fajaede.nl";

export function getPsaAppUrl(requestUrl: string): string {
  const configuredUrl = process.env.PSA_APP_URL?.trim();
  const baseUrl = configuredUrl || (process.env.NODE_ENV === "development"
    ? new URL(requestUrl).origin
    : productionPsaUrl);

  return baseUrl.replace(/\/+$/, "");
}

export function getMollieWebhookUrl(baseUrl: string): string {
  const configuredUrl = process.env.MOLLIE_WEBHOOK_URL?.trim();
  return (configuredUrl || `${baseUrl}/api/premium/webhook`).replace(/\/+$/, "");
}