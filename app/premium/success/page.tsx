// app/premium/success/page.tsx
"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

export default function SuccessPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [free, setFree] = useState<string | null>(null);
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const oid = params.get("orderId");
      const fr = params.get("free");
      setOrderId(oid);
      setFree(fr);
      if (!oid) return;

      let attempts = 0;
      const checkStatus = async () => {
        const response = await fetch(`/api/premium/status?orderId=${encodeURIComponent(oid)}`);
        if (!response.ok) return;
        const data = await response.json();
        setStatus(data.status || "pending");
        attempts += 1;
        if (data.status !== "paid" && attempts < 10) {
          window.setTimeout(checkStatus, 3000);
        }
      };
      void checkStatus();
    }
  }, []);

  const goHome = () => router.push("/");

  return (
    <main style={styles.container}>
      <h1 style={styles.title}>Bedankt voor uw aankoop!</h1>
      {free ? (
        <p style={styles.paragraph}>U heeft een gratis scan uitgevoerd.</p>
      ) : status === "paid" ? (
        <p style={styles.paragraph}>Uw premium bestelling is betaald en verwerkt.</p>
      ) : (
        <p style={styles.paragraph}>Uw betaling wordt gecontroleerd. Deze pagina wordt automatisch bijgewerkt.</p>
      )}
      <button onClick={goHome} style={styles.button}>Terug naar home</button>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#050505",
    color: "#f5f5f5",
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    padding: "2rem",
  },
  title: { fontSize: "2rem", marginBottom: "1rem" },
  paragraph: { marginBottom: "1.5rem", fontSize: "1.1rem" },
  button: {
    padding: "0.75rem 1.5rem",
    background: "#00ff99",
    border: "none",
    borderRadius: "8px",
    color: "#000",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "1rem",
  },
};
