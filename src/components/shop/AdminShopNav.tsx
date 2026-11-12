"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ExternalLink,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
} from "lucide-react";

export default function AdminShopNav() {
  const pathname = usePathname();

  const tabs = [
    { href: "/admin/qua-tang", label: "Tổng quan Shop", icon: LayoutDashboard, exact: true },
    { href: "/admin/qua-tang/san-pham", label: "Sản phẩm & Danh mục", icon: ShoppingBag, exact: false },
    { href: "/admin/qua-tang/kho", label: "Kho hàng & Biến động", icon: Boxes, exact: false },
    { href: "/admin/qua-tang/don-hang", label: "Đơn hàng & In QR", icon: Package, exact: false },
    { href: "/admin/qua-tang/cau-hinh", label: "Cấu hình Thanh toán & Ship", icon: Settings, exact: false },
  ];

  return (
    <div className="bg-[#FFF9FA] border-b border-[#F2DCE2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-3 overflow-x-clip">
        <nav className="min-w-0 flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.exact
              ? pathname === tab.href
              : pathname?.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? "bg-[#C85A77] text-white"
                    : "text-[#5C4448] hover:text-[#3E2A2D] hover:bg-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        <Link
          href="/qua-tang"
          target="_blank"
          className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-[#B94A67] hover:underline whitespace-nowrap"
        >
          <span>Mở Storefront khách</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

