"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sendLoginLink } from "@/lib/login-mail";
import { checkRateLimit, clientIpFromHeaders } from "@/lib/scan-guard";
import { consumeLoginToken, createLoginToken, normalizeEmail, setSessionCookie } from "@/lib/session";
import { verifyTurnstile } from "@/lib/turnstile";

export type LoginState = { status: "idle" | "sent" | "error"; message?: string };

const GENERIC_SENT = "Als dit adres klopt, staat er binnen een minuut een inloglink in je mailbox.";

export async function requestLoginLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = normalizeEmail(formData.get("email"));
  if (!email) return { status: "error", message: "Vul een geldig e-mailadres in." };

  const requestHeaders = await headers();
  if (!(await verifyTurnstile(formData.get("turnstileToken"), { headers: requestHeaders }))) {
    return { status: "error", message: "Bevestig eerst dat je een mens bent." };
  }

  try {
    const ipWait = await checkRateLimit("login-ip", clientIpFromHeaders(requestHeaders), 10, 15 * 60);
    const emailWait = await checkRateLimit("login-email", email, 3, 15 * 60);
    if (ipWait !== null || emailWait !== null) {
      return { status: "error", message: "Te veel inlogpogingen. Probeer het over een kwartier opnieuw." };
    }
    const token = await createLoginToken(email);
    await sendLoginLink(email, token);
  } catch (error) {
    console.error("Login link could not be sent:", error instanceof Error ? error.message : error);
    return { status: "error", message: "Inloglink versturen is mislukt. Probeer het later opnieuw." };
  }

  // Same answer whether or not the address already has an account.
  return { status: "sent", message: GENERIC_SENT };
}

export async function signInWithToken(formData: FormData): Promise<void> {
  const token = formData.get("token");
  const sessionId = typeof token === "string" ? await consumeLoginToken(token) : null;
  if (!sessionId) redirect("/login?error=link");
  await setSessionCookie(sessionId);
  redirect("/app");
}
