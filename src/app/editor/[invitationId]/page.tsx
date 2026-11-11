"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import TemplateRenderer from "@/components/template-renderer/TemplateRenderer";
import { TEMPLATES_REGISTRY, DEFAULT_TEMPLATE_SLUG } from "@/lib/templates/registry";
import { InvitationContent } from "@/lib/templates/schema";
import { findCatalogProductBySlug } from "@/data/catalogData";
import EditorStepper, { StepKey } from "@/components/editor/EditorStepper";
import SaveStatusBar from "@/components/editor/SaveStatusBar";
import SuggestionSheet from "@/components/editor/SuggestionSheet";
import BuyCreditsModal from "@/components/editor/BuyCreditsModal";
import FreeUnlockModal from "@/components/editor/FreeUnlockModal";
import RenewalModal from "@/components/editor/RenewalModal";
import TipCard from "@/components/editor/TipCard";
import QrDesigner from "@/components/editor/QrDesigner";
import ShareModal from "@/components/share/ShareModal";
import {
  Sparkles,
  Save,
  Globe,
  Lock,
  ArrowLeft,
  ArrowRight,
  Upload,
  Loader2,
  CheckCircle,
  ExternalLink,
  Eye,
  Share2,
  Trash2,
  Calendar,
  Gift,
  Plus,
  Play,
  Pause,
  Music,
  Clock,
  Copy,
  Check,
  Edit2,
  Heart,
  Volume2,
} from "lucide-react";

function EditorContent({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const stepParam = (searchParams.get("step") as StepKey) || "content";
  const [currentStep, setCurrentStep] = useState<StepKey>(stepParam);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"SAVED" | "UNSAVED" | "SAVING" | "ERROR">("SAVED");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [invitationMeta, setInvitationMeta] = useState<{
    id: string;
    title: string;
    slug: string;
    status: string;
    privacyMode: "UNLISTED" | "PASSWORD" | "PUBLIC" | "ARCHIVED";
    templateSlug: string;
    revision: number;
    expiresAt?: string | null;
    publishedAt?: string | null;
    shareLink?: string | null;
  } | null>(null);

  const [content, setContent] = useState<InvitationContent | null>(null);
  const lastSavedSnapshotRef = useRef<InvitationContent | null>(null);

  // Active view tab for mobile: "form" vs "preview"
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");

  // Modals
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [buyCreditsModal, setBuyCreditsModal] = useState<{
    open: boolean;
    type: "image_credits" | "audio_credits";
  }>({ open: false, type: "image_credits" });
  const [isFreeUnlockOpen, setIsFreeUnlockOpen] = useState(false);
  const [isRenewalOpen, setIsRenewalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState("");

  // Media credits balance
  const [creditBalance, setCreditBalance] = useState<{ imageUploads: number; audioUploads: number }>({
    imageUploads: 0,
    audioUploads: 0,
  });

  // Media state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Toasts
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Load credits balance
  const loadCredits = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/credits");
      const data = await res.json();
      if (res.ok && data.data?.balance) {
        setCreditBalance({
          imageUploads: data.data.balance.imageUploads || 0,
          audioUploads: data.data.balance.audioUploads || 0,
        });
      }
    } catch {}
  }, []);

  // Load invitation from DB
  const loadInvitation = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/invitations/${invitationId}`);
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/auth/sign-in?callbackUrl=/editor/${invitationId}`);
          return;
        }
        throw new Error("Không thể tải thông tin thiệp.");
      }
      const data = await res.json();
      const inv = data.data.invitation;

      setInvitationMeta({
        id: inv.id,
        title: inv.title,
        slug: inv.slug,
        status: inv.status,
        privacyMode: inv.privacyMode,
        templateSlug: inv.template.slug,
        revision: inv.revision,
        expiresAt: inv.expiresAt,
        publishedAt: inv.publishedAt,
        shareLink: inv.shareLink,
      });

      setTempTitle(inv.title);

      // Default loveMessages if empty for romantic/galaxy templates
      const loadedContent: InvitationContent = {
        ...inv.content,
        loveMessages:
          inv.content.loveMessages && inv.content.loveMessages.length > 0
            ? inv.content.loveMessages
            : [
                "Em là điều tuyệt vời nhất ❤️",
                "Nụ cười của em là nắng ☀️",
                "Anh nhớ em ✨",
                "Thương em hơn hôm qua 💖",
              ],
      };

      setContent(loadedContent);
      lastSavedSnapshotRef.current = JSON.parse(JSON.stringify(loadedContent));
      setSaveStatus("SAVED");
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : "Đã xảy ra lỗi tải thiệp.");
    } finally {
      setLoading(false);
    }
  }, [invitationId, router]);

  useEffect(() => {
    loadInvitation();
    loadCredits();
  }, [loadInvitation, loadCredits]);

  // Check URL query for paid toasts
  useEffect(() => {
    const paidParam = searchParams.get("paid");
    if (paidParam === "image_credits") {
      setToastNotification("Đã thanh toán thành công! Bạn đã được cộng thêm lượt tải ảnh.");
      loadCredits();
    } else if (paidParam === "audio_credits") {
      setToastNotification("Đã thanh toán thành công! Bạn đã được cộng thêm lượt tải nhạc.");
      loadCredits();
    } else if (paidParam === "gift_unlock") {
      setToastNotification("Thanh toán thành công! Món quà đã sẵn sàng.");
      loadInvitation();
    } else if (paidParam === "gift_renewal") {
      setToastNotification("Đã gia hạn thời hạn món quà thành công!");
      loadInvitation();
    } else if (paidParam === "tip") {
      setToastNotification("Cảm ơn bạn đã ủng hộ Ding Dong Gift! Chúc bạn và người thương luôn hạnh phúc.");
    }
  }, [searchParams, loadCredits, loadInvitation]);

  // Sync step changes with URL query and flush pending autosave
  const handleStepChange = (step: StepKey) => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
      saveDraft(content || undefined);
    }
    setCurrentStep(step);
    const url = new URL(window.location.href);
    url.searchParams.set("step", step);
    window.history.replaceState({}, "", url.toString());
  };

  // Autosave mechanism
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const saveDraft = async (contentToSave?: InvitationContent, newTitle?: string) => {
    if (!invitationMeta) return;
    const toSave = contentToSave || content;
    if (!toSave) return;

    const resolvedTitle =
      (newTitle !== undefined ? newTitle : toSave.title || invitationMeta.title).trim() ||
      invitationMeta.title;

    setSaving(true);
    setSaveStatus("SAVING");
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/v1/invitations/${invitationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedRevision: invitationMeta.revision,
          title: resolvedTitle,
          privacyMode: invitationMeta.privacyMode,
          content: toSave,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Lưu thất bại.");
      }

      setInvitationMeta((prev) =>
        prev
          ? {
              ...prev,
              title: resolvedTitle,
              revision: data.data.revision,
            }
          : null
      );
      if (resolvedTitle !== tempTitle) {
        setTempTitle(resolvedTitle);
      }
      lastSavedSnapshotRef.current = JSON.parse(JSON.stringify(toSave));
      setSaveStatus("SAVED");
    } catch (err: any) {
      console.error("Save draft error:", err);
      setSaveStatus("ERROR");
      setErrorMessage(err.message || "Chưa lưu được thay đổi.");
    } finally {
      setSaving(false);
    }
  };

  const triggerDirty = (newContent: InvitationContent) => {
    setContent(newContent);
    setSaveStatus("UNSAVED");

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      saveDraft(newContent);
    }, 800);
  };

  const handleRevert = () => {
    if (lastSavedSnapshotRef.current) {
      setContent(JSON.parse(JSON.stringify(lastSavedSnapshotRef.current)));
      setSaveStatus("SAVED");
    }
  };

  // Inline title save
  const handleSaveTitle = () => {
    if (!tempTitle.trim()) {
      setTempTitle(invitationMeta?.title || "");
      setIsEditingTitle(false);
      return;
    }
    setIsEditingTitle(false);
    if (tempTitle !== invitationMeta?.title) {
      saveDraft(content || undefined, tempTitle);
    }
  };

  // Image Upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCover = false) => {
    const file = e.target.files?.[0];
    if (!file || !content) return;

    // Quota check: allow cover + up to 8 gallery images seamlessly
    if (!isCover && creditBalance.imageUploads <= 0 && content.galleryUrls.length >= 8) {
      setBuyCreditsModal({ open: true, type: "image_credits" });
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("invitationId", invitationId);

      const res = await fetch("/api/v1/assets/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Tải ảnh lên thất bại.");
      }

      const imageUrl = data.data.url;

      if (isCover) {
        const updated = { ...content, coverImageUrl: imageUrl };
        triggerDirty(updated);
      } else {
        const updated = { ...content, galleryUrls: [...content.galleryUrls, imageUrl] };
        triggerDirty(updated);
        loadCredits(); // refresh credits
      }
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi khi tải ảnh.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Audio Upload handler
  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !content) return;

    setUploadingAudio(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("invitationId", invitationId);

      const res = await fetch("/api/v1/assets/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || "Tải bài nhạc thất bại.");
      }

      const audioUrl = data.data.url;
      const updated = {
        ...content,
        features: {
          ...content.features,
          backgroundMusicUrl: audioUrl,
        },
      };
      triggerDirty(updated);
      loadCredits();
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi khi tải nhạc.");
    } finally {
      setUploadingAudio(false);
    }
  };

  const toggleAudioPlay = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlayingAudio(true);
    }
  };

  // Copy Link
  const handleCopyLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const canonicalUrl = `${origin}/i/${invitationMeta?.slug}`;
    navigator.clipboard.writeText(canonicalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Create new draft
  const handleCreateNewGift = async () => {
    try {
      const res = await fetch("/api/v1/invitations/draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateSlug: invitationMeta?.templateSlug || DEFAULT_TEMPLATE_SLUG,
          forceNew: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.data?.editorUrl) {
        router.push(data.data.editorUrl);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading || !content || !invitationMeta) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 min-h-[60vh] space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
        <p className="text-xs font-semibold text-slate-600">Đang chuẩn bị trình chỉnh sửa thiệp...</p>
      </div>
    );
  }

  const isUnlocked = invitationMeta.status === "PUBLISHED";
  const catalogItem = findCatalogProductBySlug(invitationMeta.templateSlug);
  const isFreeProduct = !catalogItem || catalogItem.price === 0;
  const templateMeta = TEMPLATES_REGISTRY[invitationMeta.templateSlug] || TEMPLATES_REGISTRY[DEFAULT_TEMPLATE_SLUG];
  const publicShareUrl = typeof window !== "undefined" ? `${window.location.origin}/i/${invitationMeta.slug}` : "";

  // Expiration days calculation
  const daysLeft = invitationMeta.expiresAt
    ? Math.max(
        0,
        Math.ceil((new Date(invitationMeta.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : 30;

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-64px)] bg-slate-100 overflow-x-hidden">
      {/* 1. Header Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-3 sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/products"
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
            title="Quay lại danh mục sản phẩm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          {/* Title with Inline Edit */}
          <div className="min-w-0 flex items-center gap-2">
            {isEditingTitle ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") {
                      setTempTitle(invitationMeta.title);
                      setIsEditingTitle(false);
                    }
                  }}
                  autoFocus
                  className="px-2 py-1 text-sm font-bold text-slate-900 border border-rose-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
                <button
                  type="button"
                  onClick={handleSaveTitle}
                  className="p-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingTitle(true)}
                className="group flex items-center gap-1.5 cursor-pointer"
              >
                <h1 className="text-sm font-bold text-slate-900 truncate max-w-[180px] sm:max-w-xs group-hover:text-rose-600 transition">
                  {invitationMeta.title}
                </h1>
                <Edit2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600 opacity-60 group-hover:opacity-100" />
              </div>
            )}

            {/* Status & Expiry Badges */}
            <span
              className={`hidden sm:inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                isUnlocked
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-amber-100 text-amber-800 border border-amber-200"
              }`}
            >
              {isUnlocked ? "Đã mở khóa" : "Bản nháp"}
            </span>

            {isUnlocked && (
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Clock className="w-3 h-3" />
                <span>Còn {daysLeft} ngày</span>
              </span>
            )}
          </div>
        </div>

        {/* Mobile View Toggle */}
        <div className="flex md:hidden items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("form")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              activeTab === "form" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
            }`}
          >
            Chỉnh sửa
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              activeTab === "preview" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
            }`}
          >
            Xem mẫu
          </button>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {isUnlocked ? (
            <>
              <button
                type="button"
                onClick={() => setIsRenewalOpen(true)}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
              >
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Gia hạn / Nâng cấp</span>
              </button>

              <button
                type="button"
                onClick={handleCreateNewGift}
                className="hidden xl:flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tạo thiệp mới</span>
              </button>

              <button
                type="button"
                onClick={() => handleStepChange("finish")}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:opacity-95 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
              >
                <Gift className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lấy link &amp; QR</span>
                <span className="sm:hidden">Link &amp; QR</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (isFreeProduct) {
                  setIsFreeUnlockOpen(true);
                } else {
                  handleStepChange("finish");
                }
              }}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-[#e93459] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-rose-200 transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isFreeProduct ? "Mở khóa miễn phí" : "Hoàn tất & Mua"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Save Status Bar */}
      <SaveStatusBar
        status={saveStatus}
        errorMessage={errorMessage}
        onSave={() => saveDraft()}
        onRevert={handleRevert}
      />

      {/* Toast Notification Banner */}
      {toastNotification && (
        <div className="mx-auto max-w-xl w-full px-4 mb-2">
          <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg flex items-center justify-between text-xs font-semibold animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>{toastNotification}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastNotification(null)}
              className="text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Dual Pane Layout */}
      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        {/* Left Form Panel */}
        <div
          className={`w-full md:w-[55%] lg:w-[58%] h-full overflow-y-auto p-4 sm:p-6 space-y-6 ${
            activeTab === "form" ? "block" : "hidden md:block"
          }`}
        >
          {/* Top Info Banner if Unlocked */}
          {isUnlocked && !isBannerDismissed && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="text-xs">
                  <p className="font-bold">Món quà đã sẵn sàng!</p>
                  <p className="text-emerald-700 text-[11px]">
                    Sang bước Hoàn tất để xem trước, sao chép link gửi tặng và tải mã QR.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleStepChange("finish")}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                >
                  Lấy link &amp; QR
                </button>
                <button
                  type="button"
                  onClick={() => setIsBannerDismissed(true)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-emerald-600 hover:bg-emerald-200/60 text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Stepper (4 steps) */}
          <EditorStepper
            currentStep={currentStep}
            onStepChange={handleStepChange}
            isUnlocked={isUnlocked}
          />

          {/* ================= STEP 1: NỘI DUNG ================= */}
          {currentStep === "content" && (
            <div className="space-y-6 animate-in fade-in">
              {/* Box 1: Thông tin thiệp */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-rose-500" />
                  <span>Thông điệp chính</span>
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tiêu đề món quà / Thiệp mời *
                  </label>
                  <input
                    type="text"
                    value={content.title}
                    onChange={(e) => triggerDirty({ ...content, title: e.target.value })}
                    placeholder="Ví dụ: Vũ trụ yêu thương - Mưa Lời Yêu Thương"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-200 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phụ đề / Lời nhắn gửi ngắn
                  </label>
                  <input
                    type="text"
                    value={content.subtitle || ""}
                    onChange={(e) => triggerDirty({ ...content, subtitle: e.target.value })}
                    placeholder="Ví dụ: Giữa hàng tỷ vì sao, anh may mắn nhất vì đã tìm thấy em"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lời chúc tâm tình đầy đủ
                  </label>
                  <textarea
                    rows={4}
                    value={content.message || ""}
                    onChange={(e) => triggerDirty({ ...content, message: e.target.value })}
                    placeholder="Viết những dòng cảm xúc sâu lắng nhất..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                  />
                </div>

                {/* Personalization: People (Sender / Recipient or Bride / Groom) */}
                {(() => {
                  const tSlug = invitationMeta.templateSlug;
                  const isWedding = tSlug.startsWith("wedding-");
                  const isBirthday = tSlug.startsWith("birthday-");
                  const isGrad = tSlug.startsWith("graduation-");
                  const firstLabel = isWedding
                    ? "Tên Chú rể"
                    : isBirthday
                    ? "Tên chủ nhân bữa tiệc"
                    : isGrad
                    ? "Tên tân cử nhân"
                    : "Tên người gửi (Bạn)";
                  const secondLabel = isWedding
                    ? "Tên Cô dâu"
                    : isBirthday || isGrad
                    ? "Lời chúc từ"
                    : "Tên người nhận";
                  const p0 = content.people?.[0] || {
                    role: isWedding ? "groom" : isBirthday ? "celebrant" : isGrad ? "graduate" : "sender",
                    displayName: "",
                  };
                  const p1 = content.people?.[1] || {
                    role: isWedding ? "bride" : "recipient",
                    displayName: "",
                  };
                  const updatePeople = (idx: 0 | 1, val: string) => {
                    const nextPeople = [...(content.people || [])];
                    nextPeople[0] = idx === 0 ? { ...p0, displayName: val } : p0;
                    nextPeople[1] = idx === 1 ? { ...p1, displayName: val } : p1;
                    triggerDirty({ ...content, people: nextPeople });
                  };

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {firstLabel}
                        </label>
                        <input
                          type="text"
                          value={p0.displayName}
                          onChange={(e) => updatePeople(0, e.target.value)}
                          placeholder="Ví dụ: Minh Anh"
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          {secondLabel}
                        </label>
                        <input
                          type="text"
                          value={p1.displayName}
                          onChange={(e) => updatePeople(1, e.target.value)}
                          placeholder="Ví dụ: Ngọc Linh"
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                        />
                      </div>
                    </div>
                  );
                })()}

                {/* Lock PIN for PIN-protected interactive cards */}
                {(invitationMeta.templateSlug === "thiep-5" ||
                  invitationMeta.templateSlug === "thiep-6") && (
                  <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-800 mb-1">
                          Mã PIN mở khóa thiệp (4 chữ số)
                        </label>
                        <input
                          type="text"
                          maxLength={4}
                          value={content.features?.cardPin || ""}
                          onChange={(e) =>
                            triggerDirty({
                              ...content,
                              features: {
                                ...content.features,
                                cardPin: e.target.value.replace(/\D/g, "").slice(0, 4),
                              },
                            })
                          }
                          placeholder="Mặc định: 0000"
                          className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-rose-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
                        />
                      </div>
                      <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer pt-3 sm:pt-5">
                        <input
                          type="checkbox"
                          checked={content.features?.showPinHint !== false}
                          onChange={(e) =>
                            triggerDirty({
                              ...content,
                              features: {
                                ...content.features,
                                showPinHint: e.target.checked,
                              },
                            })
                          }
                          className="rounded border-rose-300 text-rose-600 focus:ring-rose-200"
                        />
                        <span>Hiện gợi ý mã PIN</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Event / Flight / Date details for event cards */}
                {(invitationMeta.templateSlug.startsWith("wedding-") ||
                  invitationMeta.templateSlug.startsWith("birthday-") ||
                  invitationMeta.templateSlug.startsWith("graduation-") ||
                  invitationMeta.templateSlug === "thiep-10") && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {invitationMeta.templateSlug === "thiep-10"
                        ? "Thông tin chuyến bay / Vé hẹn"
                        : "Thời gian & Địa điểm sự kiện"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          {invitationMeta.templateSlug === "thiep-10"
                            ? "Mã chuyến bay"
                            : "Tên địa điểm"}
                        </label>
                        <input
                          type="text"
                          value={content.event?.venueName || ""}
                          onChange={(e) =>
                            triggerDirty({
                              ...content,
                              event: { ...content.event, venueName: e.target.value },
                            })
                          }
                          placeholder={
                            invitationMeta.templateSlug === "thiep-10"
                              ? "VD: LV-520"
                              : "VD: White Palace"
                          }
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Ngày giờ
                        </label>
                        <input
                          type="text"
                          value={content.event?.startsAt || ""}
                          onChange={(e) =>
                            triggerDirty({
                              ...content,
                              event: { ...content.event, startsAt: e.target.value },
                            })
                          }
                          placeholder="VD: 2026-12-25 18:00"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
                        />
                      </div>
                    </div>
                    {invitationMeta.templateSlug !== "thiep-10" && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Địa chỉ chi tiết
                        </label>
                        <input
                          type="text"
                          value={content.event?.address || ""}
                          onChange={(e) =>
                            triggerDirty({
                              ...content,
                              event: { ...content.event, address: e.target.value },
                            })
                          }
                          placeholder="Số nhà, đường, quận/huyện..."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Interactive Response Question for proposal cards */}
                {(invitationMeta.templateSlug === "love-letter" ||
                  invitationMeta.templateSlug === "thiep-3" ||
                  invitationMeta.templateSlug === "thiep-4" ||
                  invitationMeta.templateSlug === "thiep-7") && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Câu hỏi tương tác trên thiệp (tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={content.responseQuestion?.question || ""}
                      onChange={(e) =>
                        triggerDirty({
                          ...content,
                          responseQuestion: {
                            question: e.target.value,
                            options: content.responseQuestion?.options?.length
                              ? content.responseQuestion.options
                              : ["Đồng ý ❤️", "Để suy nghĩ thêm"],
                          },
                        })
                      }
                      placeholder="Ví dụ: Đi hẹn hò với mình nhé?"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
                    />
                  </div>
                )}
              </div>

              {/* Box 2: Danh sách "Lời yêu thương" (Mưa chữ/Mưa lời chúc) */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-500 fill-current" />
                      <span>Lời yêu thương (Mưa chữ)</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Những câu chúc này sẽ bay bổng và rơi xuống màn hình như mưa sao băng!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSuggestionOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gợi ý</span>
                  </button>
                </div>

                {/* Helper prompt banner */}
                <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💭</span>
                    <span className="font-semibold text-rose-950">Chưa biết viết gì?</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSuggestionOpen(true)}
                    className="px-3 py-1 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 transition shadow-xs"
                  >
                    Điền nhanh cả bộ
                  </button>
                </div>

                {/* Dynamic List of Love Messages */}
                <div className="space-y-2.5">
                  {(content.loveMessages || []).map((msg, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-6 text-center text-xs font-mono font-bold text-slate-400">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={msg}
                        onChange={(e) => {
                          const updated = [...(content.loveMessages || [])];
                          updated[idx] = e.target.value;
                          triggerDirty({ ...content, loveMessages: updated });
                        }}
                        placeholder={`Lời yêu thương ${idx + 1}...`}
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (content.loveMessages || []).filter((_, i) => i !== idx);
                          triggerDirty({ ...content, loveMessages: updated });
                        }}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title={`Xóa câu ${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const current = content.loveMessages || [];
                    triggerDirty({
                      ...content,
                      loveMessages: [...current, `Thương em thêm ${current.length + 1} chút ❤️`],
                    });
                  }}
                  className="w-full py-2.5 rounded-xl border border-dashed border-rose-300 text-rose-600 hover:bg-rose-50 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Thêm lời yêu thương</span>
                </button>
              </div>

              {/* Navigation CTA */}
              <div className="flex justify-between items-center pt-2">
                <Link
                  href="/products"
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Quay lại
                </Link>
                <button
                  type="button"
                  onClick={() => handleStepChange("images")}
                  className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <span>Tiếp theo: Hình ảnh</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: HÌNH ẢNH ================= */}
          {currentStep === "images" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Hình ảnh kỷ niệm</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thêm ảnh của hai bạn để món quà thật riêng tư và ý nghĩa.
                  </p>
                </div>

                {/* Quota Card */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-rose-100 text-rose-600">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>Lượt tải ảnh:</span>
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 font-mono">
                          {creditBalance.imageUploads} lượt
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Mỗi ảnh tải lên thành công sử dụng 1 lượt
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBuyCreditsModal({ open: true, type: "image_credits" })}
                    className="px-3.5 py-2 rounded-xl bg-white border border-rose-300 hover:bg-rose-50 text-rose-600 font-bold text-xs shadow-xs transition"
                  >
                    Mua lượt tải ảnh
                  </button>
                </div>

                {/* Cover Image */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Ảnh bìa chính:</label>
                  <div className="flex items-center gap-3">
                    {content.coverImageUrl && (
                      <img
                        src={content.coverImageUrl}
                        alt="Cover"
                        className="w-16 h-16 rounded-2xl object-cover border"
                      />
                    )}
                    <label className="cursor-pointer px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-xs transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingImage ? "Đang tải ảnh..." : "Chọn ảnh bìa từ máy"}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, true)}
                      />
                    </label>
                  </div>
                </div>

                {/* Album Gallery Grid */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Album ảnh kỷ niệm:</label>
                    <span className="text-[11px] font-mono text-slate-400">
                      {content.galleryUrls.length} / 50 ảnh
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                    {/* Add Photo Slot */}
                    <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 hover:border-rose-400 bg-slate-50/60 hover:bg-rose-50/40 cursor-pointer flex flex-col items-center justify-center text-slate-400 hover:text-rose-600 transition">
                      <Plus className="w-5 h-5 mb-0.5" />
                      <span className="text-[10px] font-bold">Thêm ảnh</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, false)}
                      />
                    </label>

                    {content.galleryUrls.map((url, i) => (
                      <div key={i} className="relative group aspect-square rounded-2xl overflow-hidden border">
                        <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = content.galleryUrls.filter((_, idx) => idx !== i);
                            triggerDirty({ ...content, galleryUrls: updated });
                          }}
                          className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-4 h-4 text-rose-400" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-slate-400">
                    Giới hạn mỗi ảnh &lt; 20MB. Hỗ trợ định dạng JPG, PNG, WebP.
                  </p>
                </div>
              </div>

              {/* Navigation CTA */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => handleStepChange("content")}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Quay lại: Nội dung
                </button>
                <button
                  type="button"
                  onClick={() => handleStepChange("audio")}
                  className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <span>Tiếp theo: Âm thanh</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: ÂM THANH ================= */}
          {currentStep === "audio" && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Âm thanh &amp; Nhạc nền</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tạo bầu không khí lãng mạn du dương khi người nhận mở thiệp.
                  </p>
                </div>

                {/* Notice for templates without default music */}
                <div className="p-4 bg-rose-50/70 rounded-2xl border border-rose-200 text-xs text-rose-950 flex items-start gap-2.5">
                  <Volume2 className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold">Mẫu này không có nhạc mặc định:</p>
                    <p className="text-rose-800 leading-relaxed text-[11px]">
                      Muốn có nhạc nền ngọt ngào, hãy tải bài hát yêu thích của bạn lên (hỗ trợ MP3, WAV hoặc video tách âm tối đa 8 phút).
                    </p>
                  </div>
                </div>

                {/* Quota Card */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-indigo-100 text-indigo-600">
                      <Music className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                        <span>Lượt tải nhạc:</span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                          {creditBalance.audioUploads} lượt
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Tải lên bài hát riêng cho món quà
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setBuyCreditsModal({ open: true, type: "audio_credits" })}
                    className="px-3.5 py-2 rounded-xl bg-white border border-indigo-300 hover:bg-indigo-50 text-indigo-700 font-bold text-xs shadow-xs transition"
                  >
                    Mua lượt tải nhạc
                  </button>
                </div>

                {/* Built-in Ready-to-use Music Presets & Direct URL */}
                <div className="space-y-2.5">
                  <p className="text-xs font-semibold text-slate-700">Chọn nhanh nhạc nền có sẵn:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      {
                        label: "Hộp nhạc Lãng mạn",
                        url: "/audio/romantic-musicbox.wav",
                      },
                      {
                        label: "Piano Kỷ niệm",
                        url: "/audio/piano-memories.wav",
                      },
                      {
                        label: "Chuông Giáng Sinh",
                        url: "/audio/christmas-bell.wav",
                      },
                    ].map((preset) => {
                      const active = content.features?.backgroundMusicUrl === preset.url;
                      return (
                        <button
                          key={preset.url}
                          type="button"
                          onClick={() =>
                            triggerDirty({
                              ...content,
                              features: {
                                ...content.features,
                                backgroundMusicUrl: preset.url,
                              },
                            })
                          }
                          className={`px-3 py-2 rounded-xl border text-left text-xs font-semibold transition flex items-center gap-2 ${
                            active
                              ? "border-indigo-600 bg-indigo-50 text-indigo-800 shadow-xs"
                              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <Music className="w-3.5 h-3.5 shrink-0 text-indigo-600" />
                          <span className="truncate">{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Audio Upload and Player */}
                <div className="space-y-3">
                  <label className="cursor-pointer w-full py-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-rose-400 bg-slate-50/60 hover:bg-rose-50/40 flex flex-col items-center justify-center gap-1.5 transition text-slate-600 hover:text-rose-600">
                    {uploadingAudio ? (
                      <Loader2 className="w-6 h-6 animate-spin text-rose-600" />
                    ) : (
                      <Upload className="w-6 h-6" />
                    )}
                    <span className="text-xs font-bold">
                      {uploadingAudio ? "Đang tải bài nhạc lên..." : "Tải nhạc lên (MP3 hoặc video)"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Hỗ trợ tệp âm thanh hoặc video có tiếng (tối đa 8 phút)
                    </span>
                    <input
                      type="file"
                      accept="audio/*,video/mp4"
                      className="hidden"
                      onChange={handleAudioUpload}
                    />
                  </label>

                  {/* Audio Player if present */}
                  {content.features?.backgroundMusicUrl && (
                    <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={toggleAudioPlay}
                          className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition shadow-xs"
                        >
                          {isPlayingAudio ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>
                        <div>
                          <p className="text-xs font-bold text-indigo-950 line-clamp-1">
                            Bài nhạc nền đã chọn
                          </p>
                          <p className="text-[10px] text-indigo-700">Sẵn sàng phát khi xem thiệp</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = {
                            ...content,
                            features: {
                              ...content.features,
                              backgroundMusicUrl: null,
                            },
                          };
                          triggerDirty(updated);
                        }}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Xóa nhạc
                      </button>

                      <audio
                        ref={audioRef}
                        src={content.features.backgroundMusicUrl}
                        onEnded={() => setIsPlayingAudio(false)}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation CTA */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => handleStepChange("images")}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Quay lại: Hình ảnh
                </button>
                <button
                  type="button"
                  onClick={() => handleStepChange("finish")}
                  className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
                >
                  <span>Tiếp theo: Hoàn tất</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 4: HOÀN TẤT ================= */}
          {currentStep === "finish" && (
            <div className="space-y-6 animate-in fade-in">
              {/* If NOT UNLOCKED */}
              {!isUnlocked ? (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs text-center space-y-6">
                  <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center shadow-md shadow-rose-100">
                    <Gift className="w-8 h-8" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold font-serif text-slate-900">
                      Sắp xong rồi! 🎉
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                      {isFreeProduct
                        ? "Mở khóa miễn phí để xem trước, lấy đường link gửi tặng và thiết kế mã QR."
                        : "Hoàn tất thanh toán để mở khóa thiệp, lấy link và thiết kế mã QR."}
                    </p>
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 max-w-sm mx-auto text-xs space-y-2 text-left">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Mẫu thiệp:</span>
                      <span className="font-semibold text-slate-900">{templateMeta.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Thời hạn sử dụng:</span>
                      <span className="font-semibold text-emerald-600">1 tháng (30 ngày)</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm">
                      <span>Tổng thanh toán:</span>
                      <span className="text-emerald-600 font-mono">
                        {isFreeProduct ? "0đ (Miễn phí)" : `${catalogItem?.price.toLocaleString("vi-VN")}đ`}
                      </span>
                    </div>
                  </div>

                  {/* 3 Value Pillars */}
                  <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto pt-2">
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-1.5">
                      <Eye className="w-5 h-5 text-rose-500" />
                      <span className="text-[11px] font-semibold text-slate-700">Xem trước</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-1.5">
                      <Globe className="w-5 h-5 text-indigo-500" />
                      <span className="text-[11px] font-semibold text-slate-700">Link gửi tặng</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center gap-1.5">
                      <Gift className="w-5 h-5 text-amber-500" />
                      <span className="text-[11px] font-semibold text-slate-700">Mã QR thiệp</span>
                    </div>
                  </div>

                  {/* Unlock Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      if (autosaveTimerRef.current) {
                        clearTimeout(autosaveTimerRef.current);
                        autosaveTimerRef.current = null;
                      }
                      await saveDraft(content);

                      if (isFreeProduct) {
                        setIsFreeUnlockOpen(true);
                      } else {
                        // Create paid order
                        fetch("/api/v1/orders", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            purpose: "gift_unlock",
                            giftId: invitationMeta.id,
                            returnContext: { giftId: invitationMeta.id, step: "finish" },
                          }),
                        })
                          .then((r) => r.json())
                          .then((d) => {
                            if (d.data?.order?.id) router.push(`/checkout/${d.data.order.id}`);
                          });
                      }
                    }}
                    data-testid="unlock-gift-cta"
                    className="w-full max-w-sm mx-auto py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-[#e93459] hover:opacity-95 text-white font-bold text-sm shadow-xl shadow-rose-200 transition flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>{isFreeProduct ? "Mở khóa miễn phí" : "Hoàn tất & Thanh toán"}</span>
                  </button>
                </div>
              ) : (
                /* If UNLOCKED: Complete Sharing & QR Designer */
                <div className="space-y-6">
                  {/* Share Link Card */}
                  <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
                        <CheckCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 font-serif">
                          Món quà đã sẵn sàng! 🎁
                        </h3>
                        <p className="text-xs text-slate-500">
                          Gửi link hoặc mã QR cho người ấy. Bạn có thể sửa nội dung sau này; đường link vẫn giữ nguyên.
                        </p>
                      </div>
                    </div>

                    {/* Readonly Link Box with Copy Button */}
                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-200">
                      <input
                        type="text"
                        readOnly
                        value={publicShareUrl}
                        className="flex-1 px-3 py-1.5 text-xs font-mono text-slate-700 bg-transparent focus:outline-none select-all"
                      />
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? "Đã chép" : "Sao chép link"}</span>
                      </button>
                    </div>

                    {/* Share and Preview Actions */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsShareModalOpen(true)}
                        className="flex-1 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Chia sẻ mạng xã hội</span>
                      </button>

                      <Link
                        href={`/i/${invitationMeta.slug}`}
                        target="_blank"
                        className="flex-1 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem trước thiệp</span>
                      </Link>
                    </div>
                  </div>

                  {/* QR Designer Section */}
                  <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-base text-slate-900 font-serif">
                          QR mở thiệp
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                          Đã mở khóa
                        </span>
                      </div>
                    </div>

                    {/* Master QR Designer component */}
                    <QrDesigner
                      giftId={invitationMeta.id}
                      publicUrl={publicShareUrl}
                      slug={invitationMeta.slug}
                      cardTitle={content.title}
                    />
                  </div>

                  {/* Tip Block */}
                  <TipCard giftId={invitationMeta.id} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Preview Panel (Desktop dual-pane / Mobile view) */}
        <div
          className={`w-full md:w-[45%] lg:w-[42%] h-full overflow-y-auto bg-slate-950 flex flex-col items-center justify-start p-4 sm:p-6 border-l border-slate-800 ${
            activeTab === "preview" ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Card preview wrapper */}
          <div className="w-full max-w-[375px] bg-white rounded-[40px] shadow-2xl border-[8px] border-slate-800 overflow-hidden flex flex-col relative">
            <div className="h-6 bg-slate-900 flex items-center justify-center">
              <div className="w-20 h-3.5 bg-black rounded-full" />
            </div>

            <div className="flex-1 max-h-[780px] overflow-y-auto scrollbar-thin">
              <TemplateRenderer
                content={content}
                theme={templateMeta.theme}
                slug={invitationMeta.templateSlug}
                isPreview={true}
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-3 text-center">
            Bản xem trước trực tiếp thời gian thực
          </p>
        </div>
      </div>

      {/* Suggestion Sheet */}
      <SuggestionSheet
        isOpen={isSuggestionOpen}
        onClose={() => setIsSuggestionOpen(false)}
        currentCount={content.loveMessages?.length || 0}
        onApplyPhrases={(phrases, mode) => {
          if (mode === "replace") {
            triggerDirty({ ...content, loveMessages: phrases });
          } else {
            triggerDirty({
              ...content,
              loveMessages: [...(content.loveMessages || []), ...phrases],
            });
          }
          setToastNotification("Đã điền bộ gợi ý lời yêu thương!");
        }}
      />

      {/* Buy Credits Modal */}
      <BuyCreditsModal
        isOpen={buyCreditsModal.open}
        onClose={() => setBuyCreditsModal({ ...buyCreditsModal, open: false })}
        type={buyCreditsModal.type}
        giftId={invitationMeta.id}
      />

      {/* Free Unlock Modal */}
      <FreeUnlockModal
        isOpen={isFreeUnlockOpen}
        onClose={() => setIsFreeUnlockOpen(false)}
        invitationId={invitationMeta.id}
        giftTitle={invitationMeta.title}
        onSuccess={({ publicUrl, expiresAt }) => {
          setInvitationMeta((prev) =>
            prev
              ? {
                  ...prev,
                  status: "PUBLISHED",
                  expiresAt,
                }
              : null
          );
          setToastNotification("Mở khóa thành công! Món quà đã sẵn sàng.");
          handleStepChange("finish");
        }}
      />

      {/* Renewal Modal */}
      <RenewalModal
        isOpen={isRenewalOpen}
        onClose={() => setIsRenewalOpen(false)}
        giftId={invitationMeta.id}
        giftTitle={invitationMeta.title}
        expiresAt={invitationMeta.expiresAt}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        invitationId={invitationMeta.id}
        slug={invitationMeta.slug}
        title={invitationMeta.title}
        shortCode={invitationMeta.shareLink || undefined}
      />
    </div>
  );
}

export default function EditorPage({
  params,
}: {
  params: { invitationId: string };
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
          <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
        </div>
      }
    >
      <EditorContent invitationId={params.invitationId} />
    </Suspense>
  );
}
