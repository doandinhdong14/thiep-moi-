"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CookieConsent from "@/components/landing/CookieConsent";
import FloatingWidgets from "@/components/landing/FloatingWidgets";
import { ShopCartProvider } from "@/components/shop/ShopCartContext";
import ShopCartDrawer from "@/components/shop/ShopCartDrawer";

/**
 * Hides platform navigation, footer, cookie banners, and support widgets
 * on recipient-facing invitation routes (/i/[slug], /templates/*, and /mo-qua/[giftToken])
 * so QR scans display only the personalized card with zero ads or branding.
 */
export default function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isRecipientCardView =
    pathname?.startsWith("/i/") ||
    pathname?.startsWith("/templates/") ||
    pathname?.startsWith("/mo-qua/");

  if (isRecipientCardView) {
    return <main className="flex-1 flex flex-col min-h-screen">{children}</main>;
  }

  return (
    <ShopCartProvider>
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
      <CookieConsent />
      <FloatingWidgets />
      <ShopCartDrawer />
    </ShopCartProvider>
  );
}

