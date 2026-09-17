"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReScanRedirect() {
  const router = useRouter();
  useEffect(() => {
    // Redirect to pricing page with Re‑scan tier selected
    router.replace("/price?tier=RE_SCAN");
  }, [router]);
  return null;
}
