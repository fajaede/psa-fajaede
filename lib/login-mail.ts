import { sendMail } from "@/lib/mailer";

/** Base URL for login links: on a Vercel preview the preview itself, so you log in where you asked. */
export function appBaseUrl(): string {
  const previewUrl = process.env.VERCEL_ENV === "preview" && process.env.VERCEL_BRANCH_URL
    ? `https://${process.env.VERCEL_BRANCH_URL}`
    : "";
  return (process.env.PSA_APP_URL?.trim() || previewUrl || "https://psa.fajaede.nl").replace(/\/+$/, "");
}

/**
 * Sends the magic login link. In local development with DEV_LOG_LOGIN_LINKS=1 the
 * link is printed in the terminal instead, so nothing leaves the machine.
 */
export async function sendLoginLink(email: string, token: string): Promise<void> {
  const link = `${appBaseUrl()}/auth/verify?token=${encodeURIComponent(token)}`;

  if (process.env.NODE_ENV !== "production" && process.env.DEV_LOG_LOGIN_LINKS === "1") {
    console.log(`\n[dev] Login link for ${email}:\n${link}\n`);
    return;
  }

  await sendMail({
    to: email,
    subject: "Je inloglink voor psa.fajaede.nl",
    text:
      "Klik op de link hieronder om in te loggen op je PSA-dashboard.\n\n" +
      `${link}\n\n` +
      "De link werkt één keer en is 15 minuten geldig.\n" +
      "Heb je dit niet aangevraagd? Dan kun je deze mail negeren.\n",
  });
}
