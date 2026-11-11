"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  CreditCard,
  Store,
  Share2,
  Gift,
  LayoutDashboard,
  ArrowLeft,
  Activity,
} from "lucide-react";
import { BrandMark } from "@/components/common/BrandLogo";

export default function AdminHeader() {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "Tổng quan", icon: LayoutDashboard, exact: true },
    { href: "/admin/users", label: "Người dùng & Phân quyền", icon: Users, exact: false },
    { href: "/admin/payments", label: "Thanh toán & Đơn hàng", icon: CreditCard, exact: false },
    { href: "/admin/shops", label: "Đối tác Shop", icon: Store, exact: false },
    { href: "/admin/affiliates", label: "Cộng tác viên", icon: Share2, exact: false },
    { href: "/admin/gift-cards", label: "Thẻ QR Vật lý", icon: Gift, exact: false },
  ];

  return (
    <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 transition-colors py-1 px-2 rounded-lg hover:bg-slate-100"
              title="Quay lại Bảng điều khiển cá nhân"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Về Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <BrandMark size="sm" surface="white-card" className="w-7 h-7 p-1 rounded-lg" />
              <span className="font-serif font-bold text-slate-800 text-sm hidden md:inline">
                Admin Portal
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Health Check */}
          <div className="hidden lg:flex items-center">
            <Link
              href="/api/v1/health"
              target="_blank"
              className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-md border border-emerald-200/60 transition-colors"
              title="Kiểm tra trạng thái hệ thống & kết nối CSDL"
            >
              <Activity className="w-3 h-3 animate-pulse" />
              <span>DB Health</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

