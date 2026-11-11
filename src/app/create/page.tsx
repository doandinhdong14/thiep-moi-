"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  DEFAULT_TEMPLATE_SLUG,
  getVisibleTemplates,
  type TemplateMeta,
} from "@/lib/templates/registry";
import { Sparkles, ArrowRight, ArrowLeft, Check, Loader2, Heart, Lock } from "lucide-react";

function CreateInvitationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTemplate = searchParams.get("template");

  const [availableTemplates, setAvailableTemplates] = useState<TemplateMeta[]>(() =>
    getVisibleTemplates()
  );
  const [step, setStep] = useState<1 | 2>(preselectedTemplate ? 2 : 1);
  const [selectedOccasion, setSelectedOccasion] = useState<string>("love");
  const [selectedTemplate, setSelectedTemplate] = useState<string>(
    preselectedTemplate || DEFAULT_TEMPLATE_SLUG
  );
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/v1/templates")
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (!active) return;
        const list = payload?.data?.templates as TemplateMeta[] | undefined;
        if (Array.isArray(list) && list.length > 0) {
          setAvailableTemplates(list);
          if (!preselectedTemplate && !list.some((t) => t.slug === selectedTemplate)) {
            setSelectedTemplate(list[0].slug);
          }
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [preselectedTemplate]);

  const occasions = [
    { key: "love", title: "Tình yêu, Tỏ tình & Kỷ niệm", desc: "Vé hẹn hò #01, Vũ trụ #02, Khóa PIN #03-#04, Trái tim 3D #06, Vé bay #08...", icon: "💌" },
    { key: "christmas", title: "Giáng Sinh & Noel Diệu Kỳ", desc: "Thiệp Giáng Sinh #09 & Hộp Quà 3D #10", icon: "🎄" },
    { key: "birthday", title: "Sinh nhật & Thôi nôi", desc: "Tùy chỉnh thiệp tương tác cho người thương", icon: "🎂" },
    { key: "all", title: `Tất cả mẫu đang mở (#01 – #${String(availableTemplates.length).padStart(2, "0")})`, desc: "Xem toàn bộ các mẫu thiệp đánh số hiện có", icon: "✨" },
  ];

  const getOccasionTemplates = (occKey: string) => {
    if (occKey === "christmas") {
      return availableTemplates.filter(
        (t) => t.slug.includes("giang-sinh") || t.slug.includes("xmas")
      );
    }
    if (occKey === "all") return availableTemplates;
    const filtered = availableTemplates.filter((t) => t.occasionKey === occKey);
    return filtered.length > 0 ? filtered : availableTemplates;
  };

  const templates = getOccasionTemplates(selectedOccasion);

  const handleCreate = async () => {
    setLoading(true);
    setError(null);
    const effectiveOccasion =
      selectedOccasion === "christmas" || selectedOccasion === "all" ? "love" : selectedOccasion;

    try {
      const res = await fetch("/api/v1/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occasionKey: effectiveOccasion,
          templateSlug: selectedTemplate,
          title: title.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          // Redirect to sign in with return url
          router.push(`/auth/sign-in?callbackUrl=/create?template=${selectedTemplate}`);
          return;
        }
        throw new Error(data?.error?.message || "Không thể tạo thiệp. Vui lòng thử lại.");
      }

      // Success: redirect to editor
      router.push(`/editor/${data.data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3">
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold ${
              step === 1 ? "bg-rose-600 text-white" : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            <span>1. Chọn dịp kỷ niệm</span>
          </div>
          <span className="text-slate-300">→</span>
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold ${
              step === 2 ? "bg-rose-600 text-white" : "bg-white text-slate-700 border border-slate-200"
            }`}
          >
            <span>2. Chọn mẫu & Tên thiệp</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl text-center">
            {error}
          </div>
        )}

        {/* STEP 1: Select Occasion */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
                Bạn muốn tạo thiệp cho dịp gì?
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Chọn một chủ đề để hiển thị các mẫu thiết kế và biểu mẫu phù hợp nhất.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {occasions.map((occ) => (
                <div
                  key={occ.key}
                  onClick={() => {
                    setSelectedOccasion(occ.key);
                    const matching = getOccasionTemplates(occ.key)[0];
                    if (matching) setSelectedTemplate(matching.slug);
                    setStep(2);
                  }}
                  className={`p-6 rounded-3xl border-2 transition-all cursor-pointer bg-white flex items-center gap-4 hover:shadow-lg hover:border-rose-400 ${
                    selectedOccasion === occ.key ? "border-rose-500 shadow-md" : "border-slate-200"
                  }`}
                >
                  <div className="text-3xl p-3 bg-rose-50 rounded-2xl flex-shrink-0">{occ.icon}</div>
                  <div>
                    <h3 className="font-serif font-bold text-slate-900 text-base">{occ.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{occ.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Select Template & Title */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Đổi dịp kỷ niệm</span>
              </button>
              <span className="text-xs text-slate-500">
                Chủ đề đang chọn:{" "}
                <strong>{occasions.find((o) => o.key === selectedOccasion)?.title}</strong>
              </span>
            </div>

            <div className="space-y-2 text-center">
              <h2 className="text-2xl font-serif font-bold text-slate-900">
                Chọn phong cách mẫu bạn yêu thích
              </h2>
              <p className="text-xs text-slate-500">
                Bạn luôn có thể thay đổi màu sắc, thêm bớt ảnh hoặc chuyển mẫu sau khi tạo.
              </p>
            </div>

            {/* Template options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {templates.map((tpl) => {
                const isSelected = selectedTemplate === tpl.slug;
                return (
                  <div
                    key={tpl.slug}
                    onClick={() => setSelectedTemplate(tpl.slug)}
                    className={`rounded-3xl border-2 overflow-hidden cursor-pointer bg-white transition-all ${
                      isSelected
                        ? "border-rose-500 shadow-xl ring-2 ring-rose-200"
                        : "border-slate-200 hover:border-rose-300"
                    }`}
                  >
                    <div
                      className="p-6 text-center h-36 flex flex-col justify-center relative"
                      style={{
                        backgroundColor: tpl.theme.background,
                        color: tpl.theme.foreground,
                      }}
                    >
                      {tpl.numberCode && (
                        <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-white text-slate-950 text-[11px] font-extrabold shadow">
                          {tpl.numberCode}
                        </span>
                      )}
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
                      <h4 className="font-serif font-bold text-lg">{tpl.title}</h4>
                    </div>

                    <div className="p-4 flex items-center justify-between border-t border-slate-100">
                      <span className="text-xs text-slate-600">{tpl.description}</span>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isSelected ? "bg-rose-600 text-white" : "border border-slate-300"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Optional Title Input */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4 max-w-md mx-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tiêu đề thiệp mời (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Lễ Thành Hôn Hoàng Long & Minh Thư"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Tạo thiệp & Bắt đầu chỉnh sửa</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreateInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 bg-slate-50 py-12 px-4 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
        </div>
      }
    >
      <CreateInvitationForm />
    </Suspense>
  );
}

