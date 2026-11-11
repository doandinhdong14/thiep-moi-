"use client";

import { useState } from "react";
import { TEMPLATES_REGISTRY } from "@/lib/templates/registry";
import { templateMetaToProductItem } from "@/data/landingData";
import ProductShowcaseCard from "@/components/landing/ProductShowcaseCard";
import styles from "@/components/landing/ProductShowcase.module.css";
import { Sparkles } from "lucide-react";

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
      <div className="max-w-[1320px] mx-auto space-y-10">
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
        <div className={styles.showcaseGrid}>
          {filtered.map((tpl, index) => (
            <ProductShowcaseCard
              key={tpl.slug}
              product={templateMetaToProductItem(tpl)}
              index={index}
              primaryLabel="Chọn mẫu"
              showGuideLinks={false}
              showPrice={false}
              subtitleText={tpl.theme.style}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

