"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** "Opnieuw controleren": starts a fresh audit after the customer fixed issues. */
export function RerunButton({ token, left }: { token: string; left: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function rerun() {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/audit/${token}/rerun`, { method: "POST" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setMessage(data.error ?? "Opnieuw controleren is niet gelukt.");
      } else {
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
      <button
        type="button"
        onClick={rerun}
        disabled={busy || left === 0}
        style={{
          background: left === 0 ? "#333" : "#00ff99", color: "#050505", border: 0, borderRadius: 8,
          padding: "10px 16px", fontWeight: 700, cursor: busy || left === 0 ? "default" : "pointer",
        }}
      >
        {busy ? "Bezig…" : "Opnieuw controleren"}
      </button>
      <span style={{ color: "#a8a7a0", fontSize: 13 }}>
        {left > 0
          ? `Na het oplossen kun je je site nog ${left} keer opnieuw laten controleren (binnen 30 dagen na aankoop).`
          : "Opnieuw controleren is voor deze aankoop op."}
      </span>
      {message && <span style={{ color: "#ff9b9b", fontSize: 13 }}>{message}</span>}
    </div>
  );
}
