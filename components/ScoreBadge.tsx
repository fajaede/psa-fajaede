// components/ScoreBadge.tsx
"use client";
import { useEffect, useState } from "react";

interface ScoreBadgeProps {
  score: number;
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
  const [color, setColor] = useState<string>("#ff0000");

  useEffect(() => {
    if (score >= 80) setColor("#00ff99"); // green
    else if (score >= 50) setColor("#ffa500"); // orange
    else setColor("#ff0000"); // red
  }, [score]);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 48,
        height: 48,
        borderRadius: "50%",
        background: color,
        color: "#000",
        fontWeight: 700,
        fontSize: 14,
        animation: "pulse 1.5s infinite",
      }}
    >
      {score}
    </div>
  );
}

// style injection moved into component
