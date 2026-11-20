"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { notFound, useRouter, useSearchParams } from "next/navigation";
import { TEMPLATES_REGISTRY, getTemplateDemoContent, isTemplateLocked } from "@/lib/templates/registry";
import { createDraftEditorUrl } from "@/lib/templates/openEditor";
import TemplateRenderer from "@/components/template-renderer/TemplateRenderer";
import { Smartphone, Monitor, ArrowLeft, Pencil, Loader2, Lock } from "lucide-react";

export default function TemplateDemoPage({
  params,
}: {
  params: { slug: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [deviceView, setDeviceView] = useState<"mobile" | "desktop">("mobile");
  const [isIframe, setIsIframe] = useState(false);
  const [openingEditor, setOpeningEditor] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.self !== window.top || window.location.search.includes("embed=true")) {
        setIsIframe(true);
      }
    }
  }, []);

  const template = TEMPLATES_REGISTRY[params.slug];

  if (!template) {
    notFound();
  }

  if (isTemplateLocked(template.slug)) {
    return (
      <div className="flex-1 min-h-[70vh] bg-slate-950 text-white flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full rounded-3xl bg-slate-900 border border-amber-300/35 p-8 text-center space-y-4 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-400/15 border border-amber-300/40 text-amber-300 flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-amber-400/15 border border-amber-300/40 text-amber-200 text-xs font-bold">
            {template.launchDateLabel || "Ra mắt 24/11"}
          </span>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-white">
            {template.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Mẫu thiệp này hiện đang được khóa và sẽ chính thức ra mắt vào ngày <strong>24/11</strong>. Hiện tại bạn có thể trải nghiệm và tạo ngay 4 mẫu thiệp đầu tiên (#01 – #04).
          </p>
          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#ff6b61] to-[#fa416a] text-white text-xs sm:text-sm font-semibold shadow-md hover:opacity-95 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại danh sách thiệp</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const demoContent = getTemplateDemoContent(params.slug);
  const isEmbed = isIframe || searchParams.get("embed") === "true";
  const isAutoDemoTemplate =
    template.slug === "card-01-first-gift" ||
    template.slug === "card-02-second-gift" ||
    template.slug === "card-03-third-gift";

  if (isEmbed) {
    return (
      <div className="w-full h-[100dvh] min-h-screen bg-transparent overflow-hidden">
        <TemplateRenderer
          content={demoContent}
          theme={template.theme}
          slug={template.slug}
          templateSlug={template.slug}
          isPreview={true}
          autoDemo={isAutoDemoTemplate}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-900 min-h-screen">
      {/* Top Demo Toolbar */}
      <div className="sticky top-16 z-40 bg-slate-800/90 backdrop-blur-md border-b border-slate-700 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tất cả sản phẩm</span>
            </Link>
            <div className="h-4 w-px bg-slate-700" />
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white">{template.title}</span>
              <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                {template.theme.style}
              </span>
            </div>
          </div>

          {/* Viewport switch */}
          <div className="flex items-center gap-1 bg-slate-700/60 p-1 rounded-xl">
            <button
              onClick={() => setDeviceView("mobile")}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                deviceView === "mobile"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden md:inline">Mobile (375px)</span>
            </button>
            <button
              onClick={() => setDeviceView("desktop")}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
                deviceView === "desktop"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span className="hidden md:inline">Màn hình rộng</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/qua-tang/tat-ca?template=${template.slug}`}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-rose-200 text-xs font-medium transition-colors"
            >
              <span>Tặng kèm quà thật</span>
            </Link>
            {/* CTA Chỉnh sửa ngay */}
            <button
              type="button"
              disabled={openingEditor}
              onClick={async () => {
                if (openingEditor) return;
                setOpeningEditor(true);
                try {
                  const editorUrl = await createDraftEditorUrl(template.slug);
                  router.push(editorUrl);
                } catch (err) {
                  console.error(err);
                  alert(err instanceof Error ? err.message : "Không thể mở trang chỉnh sửa. Vui lòng thử lại.");
                } finally {
                  setOpeningEditor(false);
                }
              }}
              className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 disabled:opacity-65 text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105 flex items-center gap-1.5 cursor-pointer"
            >
              {openingEditor ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Pencil className="w-3.5 h-3.5" />
              )}
              <span>{openingEditor ? "Đang mở..." : "Chỉnh sửa ngay"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="flex-1 flex items-center justify-center py-8 px-4 overflow-x-auto">
        {deviceView === "mobile" ? (
          <div className="w-[375px] h-[780px] max-h-[880px] bg-white rounded-[40px] shadow-2xl border-[10px] border-slate-800 overflow-hidden relative">
            <TemplateRenderer
              content={demoContent}
              theme={template.theme}
              slug={template.slug}
              templateSlug={template.slug}
              isPreview={true}
              autoDemo={isAutoDemoTemplate}
            />
          </div>
        ) : (
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden h-[820px] min-h-[700px]">
            <TemplateRenderer
              content={demoContent}
              theme={template.theme}
              slug={template.slug}
              templateSlug={template.slug}
              isPreview={true}
              autoDemo={isAutoDemoTemplate}
            />
          </div>
        )}
      </div>
    </div>
  );
}
