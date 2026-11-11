"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Heart,
  Mail,
  ShieldCheck,
  Send,
  Phone,
  CheckCircle,
} from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";

export default function Footer() {
  const [subscribed, setSubscribed] = useState(false);
  const [emailInput, setEmailInput] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes("@")) return;
    setSubscribed(true);
    setEmailInput("");
  };

  const handleOpenCookieSettings = () => {
    window.dispatchEvent(new CustomEvent("open-cookie-settings"));
  };

  return (
    <footer id="contact" className="mt-auto bg-[#1d1e25] text-slate-300 pt-14 pb-8 border-t border-slate-800">
      <div className="max-w-[1140px] mx-auto px-4 sm:px-6">
        {/* 5-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6 mb-12">
          {/* Column 1: Brand intro */}
          <div className="lg:col-span-1 space-y-3.5">
            <BrandLogo size="sm" theme="dark" />

            <p className="text-xs text-slate-400 leading-relaxed">
              Nền tảng thiệp mời thông minh, mini website tương tác & thẻ QR in ấn tinh tế cho mọi khoảnh khắc đáng nhớ nhất.
            </p>

            <div className="space-y-1.5 pt-1 text-xs text-slate-400">
              <a
                href="mailto:hotro@dingdonggift.vn"
                className="flex items-center gap-2 hover:text-[#fa416a] transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-[#ff6b61] shrink-0" />
                <span>hotro@dingdonggift.vn</span>
              </a>

              <div className="flex items-center gap-2 text-slate-400">
                <Phone className="w-3.5 h-3.5 text-[#ff6b61] shrink-0" />
                <span>Hotline: 1900 8888</span>
              </div>

              <div className="flex items-center gap-2 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-[#ff6b61] shrink-0" />
                <span>Ding Dong Gift Ltd.</span>
              </div>
            </div>
          </div>

          {/* Column 2: Sản Phẩm */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3.5">
              Sản Phẩm
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/products" className="hover:text-rose-400 transition-colors">
                  Tất cả mẫu thiệp (#01 – #10)
                </Link>
              </li>
              <li>
                <Link href="/products?category=hen-ho" className="hover:text-rose-400 transition-colors">
                  Thiệp Hẹn hò & Vé bay
                </Link>
              </li>
              <li>
                <Link href="/products?category=valentine" className="hover:text-rose-400 transition-colors">
                  Thiệp Vũ trụ & Cực quang
                </Link>
              </li>
              <li>
                <Link href="/products?category=ky-niem" className="hover:text-rose-400 transition-colors">
                  Kỷ niệm & Giáng sinh
                </Link>
              </li>
              <li>
                <Link href="/partners" className="hover:text-rose-400 transition-colors">
                  Trở thành đối tác CTV
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Chủ Đề */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3.5">
              Chủ Đề
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/templates/thiep-3" className="hover:text-rose-400 transition-colors">
                  #01 · Một Tấm Vé Hẹn Hò
                </Link>
              </li>
              <li>
                <Link href="/templates/thiep-5" className="hover:text-rose-400 transition-colors">
                  #03 · Khu Vườn Khóa PIN 3D
                </Link>
              </li>
              <li>
                <Link href="/templates/thiep-8" className="hover:text-rose-400 transition-colors">
                  #06 · Vũ Trụ Trái Tim 3D
                </Link>
              </li>
              <li>
                <Link href="/templates/thiep-10" className="hover:text-rose-400 transition-colors">
                  #08 · Boarding Pass Hạnh Phúc
                </Link>
              </li>
              <li>
                <Link href="/templates/thiep-xmas" className="hover:text-rose-400 transition-colors">
                  #10 · Hộp Quà Giáng Sinh
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Chính Sách */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3.5">
              Chính Sách
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/legal/privacy" className="hover:text-rose-400 transition-colors">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="hover:text-rose-400 transition-colors">
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link href="/legal/affiliate" className="hover:text-rose-400 transition-colors">
                  Chính sách Cộng tác viên
                </Link>
              </li>
              <li>
                <Link href="/report" className="hover:text-rose-400 transition-colors">
                  Báo cáo nội dung vi phạm
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleOpenCookieSettings}
                  className="hover:text-rose-400 transition-colors text-left"
                >
                  Cài đặt cookie
                </button>
              </li>
            </ul>
          </div>

          {/* Column 5: Kết Nối */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3.5">
              Kết Nối
            </h4>
            <p className="text-xs text-slate-400 mb-3">
              Đăng ký nhận tin tức ưu đãi và mẫu thiệp mới nhất từ chúng tôi:
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Nhập email của bạn..."
                  className="w-full px-3 py-2 pr-9 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#fa416a]"
                  required
                />
                <button
                  type="submit"
                  aria-label="Đăng ký nhận tin"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-[#ff6b61] hover:text-[#fa416a] transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {subscribed && (
                <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Đăng ký nhận tin thành công!</span>
                </p>
              )}
            </form>

            <div className="flex items-center gap-3 mt-4 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-[#fa416a] flex items-center justify-center text-slate-300 hover:text-white transition-colors text-xs font-bold"
              >
                f
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-[#fa416a] flex items-center justify-center text-slate-300 hover:text-white transition-colors text-xs font-bold"
              >
                ♪
              </a>
            </div>
          </div>
        </div>

        {/* Divider & Copyright */}
        <div className="pt-6 border-t border-slate-800 text-center text-xs text-slate-500 space-y-2">
          <p>© {new Date().getFullYear()} Ding Dong Gift. Tất cả quyền được bảo lưu.</p>
          <p className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
            Được thiết kế vì những khoảnh khắc yêu thương chân thành
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
