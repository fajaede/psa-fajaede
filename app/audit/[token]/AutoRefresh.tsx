"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Reloads the server-rendered audit page every few seconds while the audit runs. */
export function AutoRefresh({ seconds = 10 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(timer);
  }, [router, seconds]);
  return null;
}
