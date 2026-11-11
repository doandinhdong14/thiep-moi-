"use client";

import { useState } from "react";
import Link from "next/link";
import type { TemplateMeta } from "@/lib/templates/registry";
import { Sparkles, Eye, ArrowRight, CheckCircle2 } from "lucide-react";

const OCCASION_LABELS: Record<string, string> = {
  love: "Tình yêu, Kỷ niệm & Noel",
  birthday: "Sinh nhật",
  wedding: "Cưới & Đính hôn",
  graduation: "Tốt nghiệp",
};

export default function TemplatesCatalogClient({
  templates,
}: {
  templates: TemplateMeta[];
}) {
  const [filter, setFilter] = useState<string>("all");

  const activeKeys = Array.from(new Set(templates.map((t) => t.occasionKey)));
  const tabs = [
    { key: "all", label: `Tất cả (${templates.length} mẫu)` },
    ...activeKeys.map((key) => ({
      key,
      label: OCCASION_LABELS[key] || key,
    })),
  ];

  const filtered =
    filter === "all"
      ? templates
      : templates.filter((t) => t.occasionKey === filter);

  return (
    <div className="flex-1 bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-rose-600" />
            <span>Bộ sưu tập đánh số #01 – #{String(templates.length).padStart(2, "0")}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900">
            Khám phá {templates.length} mẫu thiệp tương tác độc quyền
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Chỉ hiển thị các mẫu thiệp bạn đã đưa vào, được đánh số rõ ràng, hỗ trợ cá nhân hóa ảnh, nhạc nền và QR trang trí không quảng cáo.
          </p>

          {tabs.length > 2 && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    filter === tab.key
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-rose-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((tpl) => (
            <div
              key={tpl.slug}
              className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-xl hover:border-rose-300 transition-all"
            >
              <div
                className="p-6 text-center h-44 flex flex-col justify-center relative overflow-hidden"
                style={{
                  backgroundColor: tpl.theme.background,
                  color: tpl.theme.foreground,
                }}
              >
                {tpl.numberCode && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white text-slate-950 text-[11px] font-extrabold shadow-md">
                    {tpl.numberCode}
                  </span>
                )}
                {tpl.badge && (
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-amber-400/95 text-slate-950 text-[10px] font-bold shadow-xs">
                    {tpl.numberCode
                      ? tpl.badge.replace(/^Mẫu\s*#\d+\s*·\s*/i, "")
                      : tpl.badge}
                  </span>
                )}
                <p className="text-[11px] uppercase tracking-widest font-semibold opacity-75 mb-1.5">
                  {tpl.occasionTitle}
                </p>
                <h2 className="font-serif font-bold text-lg leading-snug line-clamp-2">
                  {tpl.title}
                </h2>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <p className="text-xs text-slate-600 leading-relaxed">{tpl.description}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Cá nhân hóa lời chúc, ảnh & nhạc nền • QR sạch 0% quảng cáo</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <Link
                    href={`/templates/${tpl.slug}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-full border border-slate-200 text-slate-700 hover:border-rose-300 hover:text-rose-600 text-xs font-semibold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Xem Demo</span>
                  </Link>
                  <Link
                    href={`/create?template=${tpl.slug}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-gradient-to-r from-[#ff6b61] to-[#fa416a] text-white text-xs font-semibold shadow-sm hover:opacity-95 transition-opacity"
                  >
                    <span>Tạo thiệp</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

