"use client";

import { useState } from "react";
import Link from "next/link";
import { TEMPLATES_REGISTRY } from "@/lib/templates/registry";
import { Sparkles, ArrowRight, Eye, Check } from "lucide-react";

export default function TemplatesPage() {
  const [filter, setFilter] = useState<string>("all");
  const allTemplates = Object.values(TEMPLATES_REGISTRY);

  const filtered = filter === "all"
    ? allTemplates
    : allTemplates.filter((t) => t.occasionKey === filter);

  const tabs = [
    { key: "all", label: `Tất cả (${allTemplates.length} mẫu)` },
    { key: "wedding", label: "Cưới & Đính hôn" },
    { key: "graduation", label: "Tốt nghiệp" },
    { key: "birthday", label: "Sinh nhật" },
    { key: "love", label: "Tình yêu & Tỏ tình" },
  ];

  return (
    <div className="flex-1 bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-rose-600" />
            <span>Bộ Sưu Tập Thiết Kế Hoàn Chỉnh</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
            Khám phá {allTemplates.length} mẫu thiệp & mini website độc đáo
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Mỗi mẫu đều mang phong cách thị giác, bảng màu và bố cục tương tác riêng biệt. Tương thích hoàn hảo trên điện thoại.
          </p>

          {/* Filter Tabs */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
                  filter === tab.key
                    ? "bg-rose-600 text-white shadow-md shadow-rose-200"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((tpl) => (
            <div
              key={tpl.slug}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col hover:shadow-xl transition-all group"
            >
              {/* Visual Card Header */}
              <div
                className="p-6 text-center h-48 flex flex-col justify-center relative overflow-hidden"
                style={{
                  backgroundColor: tpl.theme.background,
                  color: tpl.theme.foreground,
                }}
              >
                <span
                  className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 border mx-auto"
                  style={{
                    backgroundColor: `${tpl.theme.accent}20`,
                    borderColor: tpl.theme.accent,
                    color: tpl.theme.accent,
                  }}
                >
                  {tpl.theme.style}
                </span>

                <h3 className="text-xl font-serif font-bold line-clamp-1">{tpl.title}</h3>
                <p className="text-[11px] opacity-75 mt-1">{tpl.occasionTitle}</p>

                {tpl.isPremium && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 bg-amber-400 text-slate-900 rounded-full shadow-sm">
                    PREMIUM
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {tpl.description}
                </p>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/templates/${tpl.slug}`}
                      className="flex-1 py-2 text-center text-xs font-semibold text-slate-700 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem demo</span>
                    </Link>
                    <Link
                      href={`/create?template=${tpl.slug}`}
                      className="flex-1 py-2 text-center text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-full shadow-sm transition-all hover:scale-105 flex items-center justify-center gap-1"
                    >
                      <span>Chọn mẫu</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

