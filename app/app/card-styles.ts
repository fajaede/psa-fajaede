import type { CSSProperties } from "react";

/** Shared look of the dashboard cards (dark theme). */
export const cardStyles = {
  card: { display: "flex", flexDirection: "column", gap: 12, padding: 20, background: "#111", border: "1px solid #2a2a2a", borderRadius: 16, minWidth: 0 },
  h2: { margin: 0, fontSize: 16 },
  h3: { margin: "4px 0 0", fontSize: 14, color: "#f0efec" },
  muted: { margin: 0, color: "#a8a7a0", fontSize: 14, lineHeight: 1.5 },
  hint: { color: "#a8a7a0", fontSize: 12 },
  list: { margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 },
  domain: { color: "#f0efec", fontWeight: 700, textDecoration: "none", overflowWrap: "anywhere" },
} satisfies Record<string, CSSProperties>;
