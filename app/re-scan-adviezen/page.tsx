"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReScanAdviezenRedirect() {
  const router = useRouter();
  useEffect(() => {
    // Redirect to pricing page with Re‑scan + adviezen tier selected
    router.replace("/price?tier=RE_SCAN_ADV");
  }, [router]);
  return null;
}
