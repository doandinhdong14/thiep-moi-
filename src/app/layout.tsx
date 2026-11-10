import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CookieConsent from "@/components/landing/CookieConsent";
import FloatingWidgets from "@/components/landing/FloatingWidgets";

export const metadata: Metadata = {
  title: "Ding Dong Gift — Nền tảng tạo thiệp / Mini Website / QR Card tinh tế",
  description:
    "Tạo mini website thiệp mời đám cưới, sinh nhật, tốt nghiệp, tỏ tình tương tác và kết hợp thẻ QR vật lý, hoa quà tặng trong vài phút.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(window.self!==window.top||location.search.indexOf('embed=true')!==-1){document.documentElement.classList.add('is-embed-frame');}}catch(e){}`,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `html.is-embed-frame header,html.is-embed-frame footer,html.is-embed-frame aside{display:none!important;}`,
          }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col bg-white text-[#19191f]">
        <Navbar />
        <main className="flex-1 flex flex-col">{children}</main>
        <Footer />
        <CookieConsent />
        <FloatingWidgets />
      </body>
    </html>
  );
}
