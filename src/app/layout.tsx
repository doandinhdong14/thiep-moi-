import type { Metadata } from "next";
import "./globals.css";
import SiteChrome from "@/components/layout/SiteChrome";

export const metadata: Metadata = {
  title: "Ding Dong Gift — Nền tảng tạo thiệp / Mini Website / QR Card tinh tế",
  description:
    "Tạo mini website thiệp mời đám cưới, sinh nhật, tốt nghiệp, tỏ tình tương tác và kết hợp thẻ QR vật lý, hoa quà tặng trong vài phút.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/brand/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/brand/apple-touch-icon.png",
  },
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
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
