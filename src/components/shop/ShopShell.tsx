"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { useShopCart } from "./ShopCartContext";

interface ShopShellProps {
  children: React.ReactNode;
}

export default function ShopShell({ children }: ShopShellProps) {
  const { settings } = useShopCart();

  return (
    <div className="ddg-shop min-h-screen bg-white flex flex-col overflow-x-clip">
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
