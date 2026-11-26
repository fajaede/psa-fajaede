"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SiteAuditRedirect() {
  const router = useRouter();
  useEffect(() => {
    // Short link (LinkedIn, mails): the pricing page with the Site-audit selected.
    router.replace("/price?tier=SITE_AUDIT");
  }, [router]);
  return null;
}
