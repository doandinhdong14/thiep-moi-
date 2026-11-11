"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CookieConsent from "@/components/landing/CookieConsent";
import FloatingWidgets from "@/components/landing/FloatingWidgets";

/**
 * Hides platform navigation, footer, cookie banners, and support widgets
 * on recipient-facing invitation routes (/i/[slug] and /templates/*) so QR
 * scans display only the personalized card with zero ads or branding.
 */
export default function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isRecipientCardView =
    pathname?.startsWith("/i/") || pathname?.startsWith("/templates/");

  if (isRecipientCardView) {
    return <main className="flex-1 flex flex-col min-h-screen">{children}</main>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
      <CookieConsent />
      <FloatingWidgets />
    </>
  );
}

