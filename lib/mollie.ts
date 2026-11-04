export function getMollieApiKey(): string | undefined {
  if (process.env.VERCEL_ENV === "production") {
    return process.env.MOLLIE_API_KEY;
  }

  return process.env.MOLLIE_TEST_KEY;
}