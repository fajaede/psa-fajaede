"use client";

import { useActionState, useState } from "react";
import { Turnstile } from "@/components/Turnstile";
import { requestLoginLink, type LoginState } from "./actions";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(requestLoginLink, { status: "idle" });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  if (state.status === "sent") {
    return (
      <p role="status" style={styles.success}>
        {state.message} De link werkt één keer en is 15 minuten geldig.
      </p>
    );
  }

  return (
    <form action={formAction} style={styles.form}>
      <label style={styles.label}>
        E-mailadres
        <input name="email" type="email" autoComplete="email" required maxLength={254} style={styles.input} />
      </label>
      <input type="hidden" name="turnstileToken" value={turnstileToken ?? ""} />
      {TURNSTILE_SITE_KEY && <Turnstile siteKey={TURNSTILE_SITE_KEY} onToken={setTurnstileToken} />}
      {state.status === "error" && <p role="alert" style={styles.error}>{state.message}</p>}
      <button type="submit" disabled={pending || (Boolean(TURNSTILE_SITE_KEY) && !turnstileToken)} style={styles.button}>
        {pending ? "Bezig..." : "Stuur inloglink"}
      </button>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: { display: "flex", flexDirection: "column", gap: 16 },
  label: { display: "flex", flexDirection: "column", gap: 6, color: "#ccc", fontSize: 14 },
  input: { boxSizing: "border-box", width: "100%", minHeight: 44, padding: "10px 12px", border: "1px solid #555", borderRadius: 6, background: "#111", color: "#fff", fontSize: 16 },
  button: { minHeight: 46, padding: "12px 20px", border: 0, borderRadius: 6, background: "#00ff99", color: "#000", fontWeight: 700, cursor: "pointer" },
  error: { margin: 0, color: "#ff9b9b", fontSize: 14 },
  success: { margin: 0, color: "#77e6aa", fontSize: 15, lineHeight: 1.5 },
};
