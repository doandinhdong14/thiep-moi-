import React from "react";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { Store, MapPin, Phone, Package, ArrowRight, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

interface ShopsPageProps {
  searchParams?: {
    city?: string;
  };
}

export default async function ShopsDirectoryPage({ searchParams }: ShopsPageProps) {
  const selectedCity = searchParams?.city || "ALL";

  const shops = await prisma.shop.findMany({
    where: {
      status: "APPROVED",
      ...(selectedCity !== "ALL" ? { city: selectedCity } : {}),
    },
    include: {
      products: {
        where: { active: true },
        take: 3,
      },
      _count: {
        select: { products: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const cities = ["ALL", "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Hải Phòng", "Cần Thơ"];

  return (
    <main className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Hero Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Đối tác Hoa & Quà tặng
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-neutral-900">
            Gửi Trao Yêu Thương Cùng Quà Tặng & Thiệp QR
          </h1>
          <p className="text-neutral-600 text-sm md:text-base leading-relaxed">
            Kết hợp thiệp mời điện tử Ding Dong Gift cùng những bó hoa tươi thắm, gấu bông hoặc hộp quà cao cấp từ các đối tác uy tín.
          </p>
        </div>

        {/* City Filter */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2">
          {cities.map((city) => (
            <Link
              key={city}
              href={city === "ALL" ? "/shops" : `/shops?city=${encodeURIComponent(city)}`}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCity === city
                  ? "bg-neutral-900 text-white shadow-sm"
                  : "bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-100"
              }`}
            >
              {city === "ALL" ? "Tất cả khu vực" : city}
            </Link>
          ))}
        </div>

        {/* Shops Grid */}
        {shops.length === 0 ? (
          <div className="bg-white rounded-3xl border border-neutral-200 p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 bg-neutral-100 text-neutral-400 rounded-full flex items-center justify-center mx-auto">
              <Store className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-neutral-800">Chưa có cửa hàng ở khu vực này</h3>
            <p className="text-xs text-neutral-500">
              Hãy thử chọn khu vực khác hoặc đăng ký làm đối tác cửa hàng đầu tiên tại đây!
            </p>
            <Link
              href="/shop/apply"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-xl hover:bg-rose-700 transition"
            >
              Đăng ký đối tác
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm hover:shadow-md hover:border-neutral-300 transition flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                      <Store className="w-6 h-6" />
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-medium">
                      <MapPin className="w-3 h-3 text-neutral-400" />
                      {shop.city}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-lg text-neutral-900 group-hover:text-rose-600 transition">
                      {shop.name}
                    </h3>
                    <p className="text-xs text-neutral-500 line-clamp-2 mt-1">
                      {shop.description || "Cung cấp hoa tươi, quà tặng sinh nhật, tốt nghiệp và thẻ QR vật lý."}
                    </p>
                  </div>

                  {/* Sample Products */}
                  {shop.products.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-neutral-100">
                      <div className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                        Sản phẩm nổi bật
                      </div>
                      <div className="space-y-1.5">
                        {shop.products.map((p) => (
                          <div key={p.id} className="flex items-center justify-between text-xs text-neutral-700">
                            <span className="truncate max-w-[180px]">{p.title}</span>
                            <span className="font-semibold text-rose-600">
                              {p.minPriceVnd ? `Từ ${p.minPriceVnd.toLocaleString("vi-VN")}đ` : "Liên hệ"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
                  <span className="text-xs text-neutral-500">
                    {shop._count.products} sản phẩm
                  </span>
                  <Link
                    href={`/shops/${shop.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 group-hover:translate-x-0.5 transition"
                  >
                    <span>Xem cửa hàng</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Partner Call to Action */}
        <div className="bg-gradient-to-r from-rose-900 to-neutral-900 text-white rounded-3xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl font-serif font-bold">
              Bạn là chủ tiệm hoa hoặc cửa hàng quà tặng?
            </h2>
            <p className="text-neutral-300 text-sm max-w-xl">
              Hợp tác cùng Ding Dong Gift để tiếp cận hàng ngàn khách hàng tổ chức sự kiện, đám cưới, sinh nhật và lễ tốt nghiệp mỗi ngày.
            </p>
          </div>
          <Link
            href="/shop/apply"
            className="px-6 py-3.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm rounded-xl shadow-lg transition whitespace-nowrap"
          >
            Đăng ký đối tác ngay
          </Link>
        </div>
      </div>
    </main>
  );
}

