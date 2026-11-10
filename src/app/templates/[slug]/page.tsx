"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { notFound, useSearchParams } from "next/navigation";
import { TEMPLATES_REGISTRY, getTemplateDemoContent } from "@/lib/templates/registry";
import TemplateRenderer from "@/components/template-renderer/TemplateRenderer";
import { Smartphone, Monitor, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";

export default function TemplateDemoPage({
  params,
}: {
  params: { slug: string };
}) {
  const searchParams = useSearchParams();
  const [deviceView, setDeviceView] = useState<"mobile" | "desktop">("mobile");
  const [isIframe, setIsIframe] = useState(false);

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

  const demoContent = getTemplateDemoContent(params.slug);
  const isEmbed = isIframe || searchParams.get("embed") === "true";

  if (isEmbed) {
    return (
      <div className="w-full min-h-screen bg-transparent overflow-x-hidden">
        <TemplateRenderer
          content={demoContent}
          theme={template.theme}
          slug={template.slug}
          isPreview={true}
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
              href="/templates"
              className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tất cả mẫu</span>
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

          {/* CTA Dùng mẫu này */}
          <Link
            href={`/create?template=${template.slug}`}
            className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-105 flex items-center gap-1.5"
          >
            <span>Dùng mẫu này</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
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
              isPreview={true}
            />
          </div>
        ) : (
          <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden h-[820px] min-h-[700px]">
            <TemplateRenderer
              content={demoContent}
              theme={template.theme}
              slug={template.slug}
              isPreview={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
