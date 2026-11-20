"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Store, MapPin, Phone, Mail, Package, Sparkles, MessageSquareQuote } from "lucide-react";
import ShopRequestModal from "./ShopRequestModal";

interface Product {
  id: string;
  title: string;
  category: string;
  description: string | null;
  minPriceVnd: number | null;
  maxPriceVnd: number | null;
  leadTimeHours: number;
  qrCompatible: boolean;
  imageUrl: string | null;
}

interface Shop {
  id: string;
  name: string;
  slug: string;
  city: string;
  address: string | null;
  phone: string | null;
  contactEmail: string | null;
  description: string | null;
  products: Product[];
}

export default function ShopClientView({ shop }: { shop: Shop }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);

  const handleOpenQuote = (productId?: string) => {
    setSelectedProductId(productId);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Store Header Card */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center font-bold text-2xl shadow-md">
              <Store className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold">
                <Sparkles className="w-3 h-3" />
                Đối tác chính thức
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">{shop.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600 pt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  {shop.city}{shop.address ? ` — ${shop.address}` : ""}
                </span>
                {shop.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    {shop.phone}
                  </span>
                )}
                {shop.contactEmail && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-neutral-400" />
                    {shop.contactEmail}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            disabled
            aria-disabled="true"
            className="px-6 py-3 bg-slate-900 text-amber-200 border border-amber-300/40 text-sm font-semibold rounded-xl shadow-md flex items-center justify-center gap-2 self-start md:self-center cursor-not-allowed"
          >
            <MessageSquareQuote className="w-4 h-4" />
            <span>Ra mắt vào 1/12</span>
          </button>
        </div>

        {shop.description && (
          <p className="mt-6 pt-6 border-t border-neutral-100 text-neutral-600 text-sm leading-relaxed">
            {shop.description}
          </p>
        )}
      </div>

      {/* Product Catalog */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-rose-600" />
          Danh mục sản phẩm & quà tặng ({shop.products.length})
        </h2>

        {shop.products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center text-neutral-500">
            Cửa hàng hiện đang cập nhật danh mục sản phẩm mới. Vui lòng bấm &quot;Gửi Yêu Cầu Báo Giá&quot; để đặt theo mẫu riêng!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shop.products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm flex flex-col justify-between hover:border-neutral-300 transition"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-[11px] font-medium">
                      {product.category}
                    </span>
                    {product.qrCompatible && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-semibold">
                        Gắn QR Card
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-neutral-900">{product.title}</h3>

                  {product.description && (
                    <p className="text-xs text-neutral-500 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="pt-2">
                    <div className="text-base font-extrabold text-rose-600">
                      {product.minPriceVnd
                        ? `Từ ${product.minPriceVnd.toLocaleString("vi-VN")}đ`
                        : "Báo giá theo mẫu"}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      Chuẩn bị: ~{product.leadTimeHours} giờ
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-neutral-100">
                  <button
                    onClick={() => handleOpenQuote(product.id)}
                    className="w-full py-2 px-3 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-lg transition"
                  >
                    Đặt / Báo giá món này
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ShopRequestModal
        shopId={shop.id}
        shopName={shop.name}
        shopCity={shop.city}
        products={shop.products}
        preselectedProductId={selectedProductId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

