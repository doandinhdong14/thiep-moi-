"use client";

import React from "react";
import { AlertTriangle, Lock } from "lucide-react";
import { useShopCart } from "./ShopCartContext";
import { PHYSICAL_SHOP_LAUNCH_LABEL, PHYSICAL_SHOP_LOCKED } from "@/lib/shop/types";

interface ShopShellProps {
  children: React.ReactNode;
}

export default function ShopShell({ children }: ShopShellProps) {
  const { settings } = useShopCart();

  return (
    <div className="ddg-shop min-h-screen bg-white flex flex-col overflow-x-clip">
      {PHYSICAL_SHOP_LOCKED && (
        <div className="bg-[#FFF5F7] border-b border-[#F2DCE2] px-4 py-2.5 text-center text-xs sm:text-sm font-semibold text-[#B94A67] flex items-center justify-center gap-2">
          <Lock className="w-3.5 h-3.5 text-[#D94575] shrink-0" />
          <span>
            Các mặt hàng quà tặng vật lý sẽ chính thức{" "}
            <strong className="text-[#3E2A2D]">{PHYSICAL_SHOP_LAUNCH_LABEL}</strong>.
          </span>
        </div>
      )}

      {settings && !settings.storeOpen && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-900 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{settings.pauseMessage}</span>
        </div>
      )}

      <div className="flex-1 bg-white">{children}</div>
    </div>
  );
}
