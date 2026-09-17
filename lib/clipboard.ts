// lib/clipboard.ts
export function copyToClipboard(text: string): void {
  // Primaire Clipboard API (browser‑only)
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {
      // Fallback voor oudere browsers – alleen uitvoeren als we een document hebben
      if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed"; // avoid scrolling to bottom
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
          document.execCommand("copy");
        } catch (err) {
          console.error("Copy fallback failed", err);
        }
        document.body.removeChild(textarea);
      } else {
        console.warn("Clipboard fallback unavailable – no document");
      }
    });
  } else {
    console.warn("Clipboard API not available");
  }
}