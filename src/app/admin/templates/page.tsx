"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCode2,
  NotebookPen,
  Hash,
} from "lucide-react";

interface AdminTemplateItem {
  slug: string;
  title: string;
  numberCode: string | null;
  displayOrder: number | null;
  publicOrdinalCode: string | null;
  occasionKey: string;
  occasionTitle: string;
  description: string;
  badge: string | null;
  sourceFile: string;
  interactiveUrl: string | null;
  isUserProvided: boolean;
  defaultHidden: boolean;
  visible: boolean;
  priceVnd: number;
  note: string;
  invitationsCount: number;
}

interface AdminTemplatesResponse {
  templates: AdminTemplateItem[];
  stats: {
    total: number;
    visibleCount: number;
    hiddenCount: number;
    userProvidedCount: number;
  };
  config: {
    generalNotes: string;
    updatedAt: string;
    updatedBy: string;
  };
}

export default function AdminTemplatesPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminTemplatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<"all" | "visible" | "hidden">("all");
  const [generalNotesDraft, setGeneralNotesDraft] = useState("");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const applyPayload = useCallback((payload: AdminTemplatesResponse) => {
    setData(payload);
    setGeneralNotesDraft(payload.config.generalNotes || "");
    const drafts: Record<string, string> = {};
    for (const tpl of payload.templates) {
      drafts[tpl.slug] = tpl.note || "";
    }
    setNoteDrafts(drafts);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/templates");
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push("/auth/sign-in?callbackUrl=/admin/templates");
          return;
        }
        throw new Error("Không thể tải danh sách mẫu thiệp.");
      }
      const json = await res.json();
      if (json.data) {
        applyPayload(json.data);
      }
    } catch (err: any) {
      showToast(err.message || "Lỗi tải dữ liệu.", "error");
    } finally {
      setLoading(false);
    }
  }, [applyPayload, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sendPatch = async (body: Record<string, unknown>, successMsg: string) => {
    const res = await fetch("/api/v1/admin/templates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error?.message || "Lưu thất bại.");
    }
    if (json.data) {
      applyPayload(json.data);
    }
    showToast(successMsg);
  };

  const handleToggleVisibility = async (tpl: AdminTemplateItem) => {
    setSavingSlug(tpl.slug);
    try {
      await sendPatch(
        {
          action: "toggle_visibility",
          slug: tpl.slug,
          visible: !tpl.visible,
        },
        !tpl.visible
          ? `Đã BẬT hiển thị mẫu ${tpl.numberCode || tpl.slug} trên web.`
          : `Đã ẨN mẫu ${tpl.numberCode || tpl.slug} khỏi trang công khai.`
      );
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSavingSlug(null);
    }
  };

  const handleSaveTemplateNote = async (slug: string) => {
    setSavingSlug(slug);
    try {
      await sendPatch(
        {
          action: "update_template_note",
          slug,
          note: noteDrafts[slug] || "",
        },
        `Đã lưu ghi chú cho mẫu ${slug}.`
      );
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSavingSlug(null);
    }
  };

  const handleSaveGeneralNotes = async () => {
    setSavingGeneral(true);
    try {
      await sendPatch(
        {
          action: "update_general_notes",
          generalNotes: generalNotesDraft,
        },
        "Đã lưu Ghi chú Quản trị & Tài liệu hệ thống."
      );
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleResetDefaults = async () => {
    setSavingGeneral(true);
    try {
      await sendPatch(
        { action: "reset_defaults" },
        "Đã khôi phục mặc định: chỉ hiện 10 mẫu đã đưa vào (#01–#10) & ẩn toàn bộ mẫu gốc."
      );
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSavingGeneral(false);
    }
  };

  const filteredTemplates = (data?.templates || []).filter((tpl) => {
    if (filterMode === "visible") return tpl.visible;
    if (filterMode === "hidden") return !tpl.visible;
    return true;
  });

  if (loading && !data) {
    return (
      <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-7 h-7 animate-spin text-rose-600" />
        <p className="text-xs font-semibold">Đang tải danh sách mẫu thiệp & ghi chú quản trị...</p>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Header & Summary Strip */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-rose-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quản lý Mẫu Thiệp & Sổ Tay Ghi Chú Admin</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold">
            Kho Mẫu Đánh Số (#01 – #10) & Trạng thái Ẩn / Hiện
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Chỉ những mẫu được đánh dấu <strong>Đang hiện</strong> mới xuất hiện trên Trang chủ, Sản phẩm, Bộ sưu tập và Trang tạo thiệp.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 shrink-0">
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl px-4 py-3 text-center border border-white/10">
            <p className="text-[11px] text-emerald-200 font-semibold">Đang hiện</p>
            <p className="text-2xl font-bold text-white">{data?.stats.visibleCount ?? 10}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl px-4 py-3 text-center border border-white/10">
            <p className="text-[11px] text-slate-300 font-semibold">Đang ẩn</p>
            <p className="text-2xl font-bold text-slate-200">{data?.stats.hiddenCount ?? 8}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-2xl px-4 py-3 text-center border border-white/10">
            <p className="text-[11px] text-amber-200 font-semibold">Tổng kho</p>
            <p className="text-2xl font-bold text-amber-300">{data?.stats.total ?? 18}</p>
          </div>
        </div>
      </div>

      {/* General Operational Admin Notes Editor */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <NotebookPen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-slate-900">
                Ghi chú Tổng hợp & Tài liệu Hệ thống (Admin Notes)
              </h2>
              <p className="text-xs text-slate-500">
                Lưu trữ vĩnh viễn trong CSDL • Cập nhật lần cuối:{" "}
                {data?.config.updatedAt && data.config.updatedAt !== new Date(0).toISOString()
                  ? new Date(data.config.updatedAt).toLocaleString("vi-VN")
                  : "Cấu hình chuẩn hệ thống"}{" "}
                ({data?.config.updatedBy || "system"})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaults}
              disabled={savingGeneral}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục mặc định (#01–#10)</span>
            </button>
            <button
              type="button"
              onClick={handleSaveGeneralNotes}
              disabled={savingGeneral}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
            >
              {savingGeneral ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>Lưu Ghi chú</span>
            </button>
          </div>
        </div>

        <textarea
          value={generalNotesDraft}
          onChange={(e) => setGeneralNotesDraft(e.target.value)}
          rows={12}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs sm:text-[13px] font-mono text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-rose-200 focus:bg-white"
        />
      </div>

      {/* Filter Tabs + Template Inventory Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-rose-600" />
            <h2 className="text-base sm:text-lg font-serif font-bold text-slate-900">
              Bảng Đánh Số & Quản lý Chi tiết Từng Mẫu
            </h2>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
            {[
              { key: "all", label: `Tất cả (${data?.stats.total ?? 0})` },
              { key: "visible", label: `Đang hiện (${data?.stats.visibleCount ?? 0})` },
              { key: "hidden", label: `Đang ẩn (${data?.stats.hiddenCount ?? 0})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterMode(tab.key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  filterMode === tab.key
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredTemplates.map((tpl) => {
            const isBusy = savingSlug === tpl.slug;
            return (
              <div
                key={tpl.slug}
                className={`p-5 transition-colors ${
                  tpl.visible ? "bg-white" : "bg-slate-50/80 opacity-90"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-4 justify-between">
                  {/* Left Info Column */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold ${
                          tpl.visible
                            ? "bg-rose-600 text-white shadow-xs"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {tpl.publicOrdinalCode || tpl.numberCode || "ẨN"}
                      </span>

                      <span className="font-serif font-bold text-slate-900 text-sm sm:text-base">
                        {tpl.title}
                      </span>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                          tpl.isUserProvided
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {tpl.isUserProvided ? "Mẫu bạn đưa vào" : "Mẫu mặc định nền tảng"}
                      </span>

                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold">
                        {tpl.invitationsCount} thiệp đã tạo
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>
                        Slug: <code className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{tpl.slug}</code>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FileCode2 className="w-3.5 h-3.5 text-slate-400" />
                        <code className="font-mono text-slate-700">{tpl.sourceFile}</code>
                      </span>
                      <span>Dịp: {tpl.occasionTitle}</span>
                      <span>Giá: {new Intl.NumberFormat("vi-VN").format(tpl.priceVnd)}đ</span>
                    </div>

                    {/* Per-template editable Admin Note */}
                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        value={noteDrafts[tpl.slug] ?? ""}
                        onChange={(e) =>
                          setNoteDrafts((prev) => ({
                            ...prev,
                            [tpl.slug]: e.target.value,
                          }))
                        }
                        placeholder="Thêm ghi chú cho mẫu này..."
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
                      />
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleSaveTemplateNote(tpl.slug)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Lưu note mẫu</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Actions Column */}
                  <div className="flex flex-wrap lg:flex-col items-center lg:items-end justify-end gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleVisibility(tpl)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer disabled:opacity-50 ${
                        tpl.visible
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {isBusy ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : tpl.visible ? (
                        <Eye className="w-3.5 h-3.5" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5" />
                      )}
                      <span>{tpl.visible ? "Đang hiện (Bấm để ẩn)" : "Đang ẩn (Bấm để hiện)"}</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/templates/${tpl.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:border-rose-300 hover:text-rose-600 text-xs font-semibold"
                      >
                        <span>Demo</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <Link
                        href={`/create?template=${tpl.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold"
                      >
                        <span>Tạo thử</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

