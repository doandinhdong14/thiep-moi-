"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Music,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
  ExternalLink,
  Smartphone,
  Monitor,
  Gift,
  MailOpen,
} from "lucide-react";
import TemplateRenderer from "@/components/template-renderer/TemplateRenderer";
import type { TemplateMeta } from "@/lib/templates/registry";
import type { InvitationContent } from "@/lib/templates/schema";
import {
  formatVnd,
  isShopApiSuccess,
  type CardPlanOption,
  type GiftWrapOption,
} from "@/lib/shop/types";

export interface WizardTemplateOption {
  slug: string;
  title: string;
  occasionKey: string;
  occasionTitle: string;
  description: string;
  badge?: string;
  previewUrl: string;
  theme: TemplateMeta["theme"];
}

export interface WizardMusicOption {
  id: string;
  label: string;
  url: string;
  mood: string;
}

export interface WizardSuggestion {
  key: string;
  label: string;
  text: string;
}

export interface WizardSavedResult {
  customizationId: string;
  templateSlug: string;
  templateTitle: string;
  previewImageUrl: string;
  cardPlanCode: string;
  giftWrapCode: string;
  recipientName: string;
  senderName: string;
  title: string;
  message: string;
  occasion: string;
  musicTrackId: string;
  photoUrls: string[];
}

interface GiftPersonalizationWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: (result: WizardSavedResult) => Promise<void> | void;
  productName: string;
  boxLabel?: string;
  eligibleSlugs?: string[];
  defaultTemplateSlug?: string;
  cardPlans: CardPlanOption[];
  giftWrapOptions: GiftWrapOption[];
  initialData?: {
    customizationId?: string | null;
    templateSlug?: string;
    cardPlanCode?: string;
    giftWrapCode?: string;
    recipientName?: string;
    senderName?: string;
    title?: string;
    message?: string;
    occasion?: string | null;
    musicTrackId?: string | null;
    photoUrls?: string[];
  };
  lockPricingTier?: boolean;
}

export default function GiftPersonalizationWizard({
  open,
  onClose,
  onComplete,
  productName,
  boxLabel,
  eligibleSlugs,
  defaultTemplateSlug = "thiep-8",
  cardPlans,
  giftWrapOptions,
  initialData,
  lockPricingTier = false,
}: GiftPersonalizationWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [templates, setTemplates] = useState<WizardTemplateOption[]>([]);
  const [musicTracks, setMusicTracks] = useState<WizardMusicOption[]>([]);
  const [suggestions, setSuggestions] = useState<WizardSuggestion[]>([]);
  const [templateFilter, setTemplateFilter] = useState<string>("all");

  const [customizationId, setCustomizationId] = useState<string | null>(
    initialData?.customizationId || null,
  );
  const [templateSlug, setTemplateSlug] = useState<string>(
    initialData?.templateSlug || defaultTemplateSlug,
  );
  const [recipientName, setRecipientName] = useState<string>(
    initialData?.recipientName || "",
  );
  const [senderName, setSenderName] = useState<string>(initialData?.senderName || "");
  const [title, setTitle] = useState<string>(initialData?.title || "");
  const [message, setMessage] = useState<string>(initialData?.message || "");
  const [occasion, setOccasion] = useState<string>(initialData?.occasion || "Quà tặng");
  const [musicTrackId, setMusicTrackId] = useState<string>(
    initialData?.musicTrackId || "romantic-musicbox",
  );
  const [photoUrls, setPhotoUrls] = useState<string[]>(initialData?.photoUrls || []);
  const [cardPlanCode, setCardPlanCode] = useState<string>(
    initialData?.cardPlanCode ||
      cardPlans.find((p) => p.isDefault)?.code ||
      cardPlans[0]?.code ||
      "DEFAULT",
  );
  const [giftWrapCode, setGiftWrapCode] = useState<string>(
    initialData?.giftWrapCode || giftWrapOptions[0]?.code || "NONE",
  );

  const [previewDevice, setPreviewDevice] = useState<"mobile" | "desktop">("mobile");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{
    theme: TemplateMeta["theme"];
    content: InvitationContent;
    interactiveHtml: string | null;
  } | null>(null);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setErrorMsg(null);
    setCustomizationId(initialData?.customizationId || null);
    setTemplateSlug(initialData?.templateSlug || defaultTemplateSlug);
    setRecipientName(initialData?.recipientName || "");
    setSenderName(initialData?.senderName || "");
    setTitle(initialData?.title || "");
    setMessage(initialData?.message || "");
    setOccasion(initialData?.occasion || "Quà tặng");
    setMusicTrackId(initialData?.musicTrackId ?? "romantic-musicbox");
    setPhotoUrls(initialData?.photoUrls || []);
    if (initialData?.cardPlanCode) setCardPlanCode(initialData.cardPlanCode);
    if (initialData?.giftWrapCode) setGiftWrapCode(initialData.giftWrapCode);

    const eligibleQuery =
      eligibleSlugs && eligibleSlugs.length > 0
        ? `?eligible=${encodeURIComponent(eligibleSlugs.join(","))}`
        : "";
    fetch(`/api/shop/templates${eligibleQuery}`)
      .then((r) => r.json())
      .then((json) => {
        if (isShopApiSuccess(json) && json.data) {
          setTemplates(json.data.templates || []);
          setMusicTracks(json.data.musicTracks || []);
          setSuggestions(json.data.messageSuggestions || []);
          if (!initialData?.templateSlug && json.data.fallbackSlug) {
            setTemplateSlug((curr) =>
              json.data.templates?.some((t: WizardTemplateOption) => t.slug === curr)
                ? curr
                : json.data.fallbackSlug,
            );
          }
        }
      })
      .catch(() => {});

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setPlayingTrackId(null);
    };
  }, [open, initialData, defaultTemplateSlug, eligibleSlugs]);

  useEffect(() => {
    if (!open || step !== 3) return;
    let active = true;
    setPreviewLoading(true);
    fetch("/api/shop/templates/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateSlug,
        recipientName: recipientName || "Người thương",
        senderName: senderName || "Bạn",
        title: title || `Gửi ${recipientName || "người thương"} lời chúc ấm áp`,
        message:
          message ||
          "Gửi bạn chút mềm mại và bình yên trong hộp quà nhỏ này.",
        occasion,
        musicTrackId,
        photoUrls,
      }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (active && isShopApiSuccess(json)) {
          setPreviewData({
            theme: json.data.theme,
            content: json.data.content,
            interactiveHtml: json.data.interactiveHtml,
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setPreviewLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    open,
    step,
    templateSlug,
    recipientName,
    senderName,
    title,
    message,
    occasion,
    musicTrackId,
    photoUrls,
  ]);

  if (!open) return null;

  const selectedTemplate =
    templates.find((t) => t.slug === templateSlug) || templates[0];
  const selectedPlan =
    cardPlans.find((p) => p.code === cardPlanCode) || cardPlans[0];
  const selectedWrap =
    giftWrapOptions.find((w) => w.code === giftWrapCode) || giftWrapOptions[0];

  const handleToggleAudio = (track: WizardMusicOption) => {
    if (!track.url) return;
    if (playingTrackId === track.id && audioRef.current) {
      audioRef.current.pause();
      setPlayingTrackId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(track.url);
    audio.volume = 0.5;
    audio.onended = () => setPlayingTrackId(null);
    audio.play().catch(() => {});
    audioRef.current = audio;
    setPlayingTrackId(track.id);
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (photoUrls.length >= 6) {
      setErrorMsg("Mỗi thiệp hỗ trợ tối đa 6 ảnh kỷ niệm.");
      return;
    }

    setErrorMsg(null);
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("file", files[0]);
      const res = await fetch("/api/shop/uploads", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !isShopApiSuccess(json)) {
        setErrorMsg(json?.error?.message || "Tải ảnh thất bại.");
      } else {
        setPhotoUrls((prev) => [...prev, json.data.publicUrl].slice(0, 6));
      }
    } catch {
      setErrorMsg("Không thể tải ảnh lên lúc này.");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleApplySuggestion = (sug: WizardSuggestion) => {
    if (!message.trim()) {
      setMessage(sug.text);
      return;
    }
    setMessage((prev) => `${prev.trim()}\n\n${sug.text}`);
  };

  const handlePersistAndFinish = async () => {
    setErrorMsg(null);
    setSaving(true);
    try {
      const payload = {
        templateSlug,
        cardPlanCode: lockPricingTier ? undefined : cardPlanCode,
        giftWrapCode: lockPricingTier ? undefined : giftWrapCode,
        recipientName: recipientName.trim() || "Người thương",
        senderName: senderName.trim() || "Bạn",
        title: title.trim() || `Gửi ${recipientName.trim() || "người thương"}`,
        message:
          message.trim() ||
          "Gửi bạn chút mềm mại và lời chúc bình an trong hộp quà này.",
        occasion: occasion.trim() || "Quà tặng",
        musicTrackId,
        photoUrls,
        status: "ATTACHED" as const,
      };

      const url = customizationId
        ? `/api/shop/customizations/${customizationId}`
        : "/api/shop/customizations";
      const method = customizationId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !isShopApiSuccess(json)) {
        setErrorMsg(json?.error?.message || "Không lưu được nội dung thiệp.");
        setSaving(false);
        return;
      }

      const savedId = json.data.id as string;
      setCustomizationId(savedId);

      await onComplete({
        customizationId: savedId,
        templateSlug: json.data.templateSlug || templateSlug,
        templateTitle: selectedTemplate?.title || "Thiệp DingDong",
        previewImageUrl: selectedTemplate?.previewUrl || `/previews/${templateSlug}.webp`,
        cardPlanCode: json.data.cardPlanCode || cardPlanCode,
        giftWrapCode: json.data.giftWrapCode || giftWrapCode,
        recipientName: json.data.recipientName,
        senderName: json.data.senderName,
        title: json.data.title,
        message: json.data.message,
        occasion: json.data.occasion || occasion,
        musicTrackId: json.data.musicTrackId || musicTrackId,
        photoUrls: json.data.photoUrls || photoUrls,
      });

      onClose();
    } catch {
      setErrorMsg("Có lỗi xảy ra khi lưu thiệp.");
    } finally {
      setSaving(false);
    }
  };

  const filteredTemplates = templates.filter((t) => {
    if (templateFilter === "all") return true;
    if (templateFilter === "xmas") return t.slug.includes("xmas") || t.slug.includes("giang-sinh");
    if (templateFilter === "ticket") return t.slug === "thiep-3" || t.slug === "thiep-10";
    return !t.slug.includes("xmas") && !t.slug.includes("giang-sinh");
  });

  const stepsMeta = [
    { id: 1 as const, label: "1. Chọn mẫu thiệp" },
    { id: 2 as const, label: "2. Lời chúc & Ảnh" },
    { id: 3 as const, label: "3. Xem thiệp thật" },
    { id: 4 as const, label: "4. Gói quà & Gắn hộp" },
  ];

  return (
    <div
      className="ddg-shop fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-[#3E2A2D]/50 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Cá nhân hóa thiệp online kèm hộp quà"
    >
      <div className="bg-[#FFF9F5] w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-5xl sm:rounded-3xl border border-[#F2DCE2] shadow-2xl flex flex-col overflow-hidden">
        {/* Top Envelope Header */}
        <div className="bg-white px-4 sm:px-6 py-4 border-b border-[#F2DCE2] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-2xl bg-[#FDECF0] text-[#FF5C8D] flex items-center justify-center shrink-0">
              <MailOpen className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <h2 className="font-serif font-bold text-base sm:text-lg text-[#3E2A2D] truncate">
                Cá nhân hóa thiệp online kèm hộp quà
              </h2>
              <p className="text-xs text-[#7C6368] truncate">
                {boxLabel ? `${boxLabel} • ` : ""}
                {productName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng trình soạn thiệp"
            className="w-10 h-10 rounded-full hover:bg-[#FDECF0] text-[#3E2A2D] flex items-center justify-center shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4-Step Progress Pills */}
        <div className="bg-[#FDF9F6] px-4 sm:px-6 py-2.5 border-b border-[#F2DCE2] flex items-center gap-2 overflow-x-auto ddg-no-scrollbar shrink-0">
          {stepsMeta.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                step === s.id
                  ? "bg-[#FF5C8D] text-white shadow-xs"
                  : step > s.id
                    ? "bg-[#FDECF0] text-[#D94575]"
                    : "bg-white text-[#7C6368] border border-[#F2DCE2]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Step Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {errorMsg && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2.5 text-xs text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          {/* STEP 1: CHOOSE REAL TEMPLATE */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#3E2A2D]">
                    Chọn mẫu thiệp trong thư viện DingDongGift
                  </h3>
                  <p className="text-xs text-[#7C6368]">
                    Mỗi mẫu thiệp có chuyển động &amp; tương tác riêng khi người nhận quét QR.
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { key: "all", label: "Tất cả mẫu" },
                    { key: "love", label: "Lãng mạn / 3D" },
                    { key: "ticket", label: "Vé / Boarding Pass" },
                    { key: "xmas", label: "Giáng sinh" },
                  ].map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setTemplateFilter(f.key)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                        templateFilter === f.key
                          ? "bg-[#3E2A2D] text-white border-[#3E2A2D]"
                          : "bg-white text-[#7C6368] border-[#F2DCE2]"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((tpl) => {
                  const selected = tpl.slug === templateSlug;
                  return (
                    <div
                      key={tpl.slug}
                      onClick={() => setTemplateSlug(tpl.slug)}
                      className={`cursor-pointer rounded-2xl bg-white border-2 overflow-hidden transition-all ${
                        selected
                          ? "border-[#FF5C8D] shadow-md ring-2 ring-[#FF5C8D]/20"
                          : "border-[#F2DCE2] hover:border-[#E892A9]"
                      }`}
                    >
                      <div className="relative aspect-[16/10] bg-[#FDF2F5] overflow-hidden">
                        <img
                          src={tpl.previewUrl}
                          alt={tpl.title}
                          className="w-full h-full object-cover"
                        />
                        {selected && (
                          <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-[#FF5C8D] text-white text-[11px] font-bold inline-flex items-center gap-1 shadow-sm">
                            <Check className="w-3 h-3" />
                            Đang chọn
                          </span>
                        )}
                        {tpl.badge && (
                          <span className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-white/95 text-[#3E2A2D] text-[11px] font-semibold">
                            {tpl.badge}
                          </span>
                        )}
                      </div>
                      <div className="p-3.5 space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-sm text-[#3E2A2D] line-clamp-1">
                            {tpl.title}
                          </h4>
                        </div>
                        <p className="text-xs text-[#7C6368] line-clamp-2">{tpl.description}</p>
                        <div className="pt-1 flex items-center justify-between text-xs">
                          <span className="text-[#D94575] font-semibold">
                            {selected ? "Đã chọn mẫu này" : "Nhấn để chọn"}
                          </span>
                          <a
                            href={`/templates/${tpl.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-[#7C6368] hover:text-[#FF5C8D]"
                          >
                            <span>Xem mẫu</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: WRITE MESSAGE, MUSIC, PHOTOS */}
          {step === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#3E2A2D] mb-1">
                      Tên người nhận
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="VD: Minh Anh, Mẹ yêu, Em..."
                      maxLength={80}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#F2DCE2] text-sm focus:outline-none focus:border-[#FF5C8D]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3E2A2D] mb-1">
                      Tên người gửi
                    </label>
                    <input
                      type="text"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="VD: Tuấn, Con gái, Anh..."
                      maxLength={80}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#F2DCE2] text-sm focus:outline-none focus:border-[#FF5C8D]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#3E2A2D] mb-1">
                      Tiêu đề thiệp
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="VD: Gửi em một chút ấm áp"
                      maxLength={120}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#F2DCE2] text-sm focus:outline-none focus:border-[#FF5C8D]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#3E2A2D] mb-1">
                      Dịp tặng quà
                    </label>
                    <input
                      type="text"
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                      placeholder="Sinh nhật / Kỷ niệm / Noel..."
                      maxLength={60}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#F2DCE2] text-sm focus:outline-none focus:border-[#FF5C8D]"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="text-xs font-semibold text-[#3E2A2D]">
                      Lời nhắn yêu thương
                    </label>
                    <span className="text-[11px] text-[#7C6368]">{message.length}/2000</span>
                  </div>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Viết những điều bạn muốn người nhận đọc ngay khi mở hộp quà..."
                    maxLength={2000}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#F2DCE2] text-sm leading-relaxed focus:outline-none focus:border-[#FF5C8D]"
                  />
                  {suggestions.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <p className="text-[11px] text-[#7C6368] font-medium">
                        Gợi ý nhanh (chỉ chèn thêm, không xóa chữ bạn đang viết):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {suggestions.map((s) => (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => handleApplySuggestion(s)}
                            className="px-2.5 py-1 rounded-full bg-white border border-[#F2DCE2] hover:border-[#FF5C8D] text-[11px] font-medium text-[#3E2A2D]"
                          >
                            + {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Music & Photo Upload */}
              <div className="lg:col-span-5 space-y-5">
                <div className="bg-white rounded-2xl border border-[#F2DCE2] p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#3E2A2D]">
                    <Music className="w-4 h-4 text-[#FF5C8D]" />
                    <span>Nhạc nền khi mở thiệp</span>
                  </div>
                  <div className="space-y-2">
                    {musicTracks.map((track) => (
                      <div
                        key={track.id || "none"}
                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs cursor-pointer ${
                          musicTrackId === track.id
                            ? "border-[#FF5C8D] bg-[#FFF9F5]"
                            : "border-[#F2DCE2] bg-white"
                        }`}
                        onClick={() => setMusicTrackId(track.id)}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-[#3E2A2D] truncate">{track.label}</p>
                          <p className="text-[11px] text-[#7C6368]">{track.mood}</p>
                        </div>
                        {track.url && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleAudio(track);
                            }}
                            aria-label={`Nghe thử ${track.label}`}
                            className="w-8 h-8 rounded-full bg-[#FDECF0] text-[#D94575] flex items-center justify-center shrink-0"
                          >
                            {playingTrackId === track.id ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#F2DCE2] p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-[#3E2A2D]">
                    <span className="inline-flex items-center gap-1.5">
                      <ImagePlus className="w-4 h-4 text-[#FF5C8D]" />
                      Ảnh kỷ niệm đính kèm ({photoUrls.length}/6)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {photoUrls.map((url, idx) => (
                      <div
                        key={`${url}-${idx}`}
                        className="relative aspect-square rounded-xl overflow-hidden border border-[#F2DCE2] group"
                      >
                        <img src={url} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() =>
                            setPhotoUrls((prev) => prev.filter((_, i) => i !== idx))
                          }
                          aria-label="Xóa ảnh"
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/65 text-white flex items-center justify-center"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {photoUrls.length < 6 && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-[#E892A9] bg-[#FFF9F5] hover:bg-[#FDECF0]/50 flex flex-col items-center justify-center gap-1 cursor-pointer text-[11px] font-semibold text-[#D94575] text-center p-2">
                        <ImagePlus className="w-5 h-5" />
                        <span>{uploadingPhoto ? "Đang tải..." : "Tải ảnh"}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleUploadPhoto}
                          disabled={uploadingPhoto}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-[11px] text-[#7C6368]">
                    Hỗ trợ JPG/PNG/WebP dưới 5MB. Ảnh chỉ hiển thị riêng tư trên link QR thiệp của hộp quà.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: LIVE PREVIEW & CARD PLAN */}
          {step === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#3E2A2D]">
                    Xem trước đúng mẫu thiệp thật ({selectedTemplate?.title})
                  </span>
                  <div className="inline-flex rounded-full bg-white border border-[#F2DCE2] p-1">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("mobile")}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        previewDevice === "mobile"
                          ? "bg-[#FF5C8D] text-white"
                          : "text-[#7C6368]"
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      Mobile
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("desktop")}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        previewDevice === "desktop"
                          ? "bg-[#FF5C8D] text-white"
                          : "text-[#7C6368]"
                      }`}
                    >
                      <Monitor className="w-3.5 h-3.5" />
                      Desktop
                    </button>
                  </div>
                </div>

                <div className="flex justify-center bg-[#F6ECF0] rounded-2xl p-3 border border-[#F2DCE2]">
                  {previewLoading || !previewData ? (
                    <div className="w-full h-[460px] flex items-center justify-center text-xs text-[#7C6368]">
                      Đang dựng bản xem trước thiệp thật...
                    </div>
                  ) : (
                    <div
                      className={`bg-white rounded-2xl shadow-lg overflow-hidden border border-[#E6CCD5] transition-all ${
                        previewDevice === "mobile"
                          ? "w-[340px] h-[520px]"
                          : "w-full h-[520px]"
                      }`}
                    >
                      <TemplateRenderer
                        content={previewData.content}
                        theme={previewData.theme}
                        slug={`preview-${templateSlug}`}
                        templateSlug={templateSlug}
                        interactiveHtml={previewData.interactiveHtml || undefined}
                        isPreview={true}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Card Validity Rule & Optional Plan */}
              <div className="lg:col-span-5 space-y-4">
                <div className="rounded-2xl bg-white border border-[#F2DCE2] p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#3E2A2D]">
                    <ShieldCheck className="w-4 h-4 text-[#FF5C8D]" />
                    <span>Quy tắc bảo vệ thời hạn thiệp QR</span>
                  </div>
                  <p className="text-xs text-[#7C6368] leading-relaxed">
                    Thiệp chưa mở sẽ ở trạng thái chờ nhận hàng. <strong>Thời gian sử dụng chỉ bắt đầu tính khi người nhận quét QR và nhấn &ldquo;Mở thiệp&rdquo;</strong> — giúp thời gian giao vận chuyển không làm hao hụt ngày lưu giữ kỷ niệm.
                  </p>
                </div>

                <div className="rounded-2xl bg-white border border-[#F2DCE2] p-4 space-y-3">
                  <h4 className="text-xs font-bold text-[#3E2A2D]">
                    Thời hạn lưu giữ thiệp {lockPricingTier ? "(đã chốt theo đơn)" : ""}
                  </h4>
                  <div className="space-y-2">
                    {cardPlans.map((plan) => (
                      <button
                        key={plan.code}
                        type="button"
                        disabled={lockPricingTier}
                        onClick={() => setCardPlanCode(plan.code)}
                        className={`w-full text-left p-3 rounded-xl border transition-colors ${
                          cardPlanCode === plan.code
                            ? "border-[#FF5C8D] bg-[#FFF9F5]"
                            : "border-[#F2DCE2] bg-white"
                        } disabled:opacity-60`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-[#3E2A2D]">
                            {plan.label}
                          </span>
                          <span className="text-xs font-bold text-[#FF5C8D] shrink-0">
                            {plan.priceVnd === 0 ? "Miễn phí" : `+${formatVnd(plan.priceVnd)}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7C6368] mt-1">{plan.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: GIFT WRAP & ATTACH TO BOX */}
          {step === 4 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-6 space-y-3">
                <h3 className="font-serif font-bold text-lg text-[#3E2A2D]">
                  Chọn phong cách gói hộp quà
                </h3>
                <div className="space-y-2.5">
                  {giftWrapOptions.map((wrap) => (
                    <button
                      key={wrap.code}
                      type="button"
                      disabled={lockPricingTier}
                      onClick={() => setGiftWrapCode(wrap.code)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        giftWrapCode === wrap.code
                          ? "border-[#FF5C8D] bg-white shadow-xs"
                          : "border-[#F2DCE2] bg-white/70"
                      } disabled:opacity-60`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 text-sm font-bold text-[#3E2A2D]">
                          <Gift className="w-4 h-4 text-[#FF5C8D]" />
                          {wrap.label}
                        </span>
                        <span className="text-xs font-bold text-[#FF5C8D]">
                          {wrap.priceVnd === 0 ? "Kèm sẵn" : `+${formatVnd(wrap.priceVnd)}`}
                        </span>
                      </div>
                      <p className="text-xs text-[#7C6368] mt-1">{wrap.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="bg-white rounded-2xl border border-[#F2DCE2] p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-serif font-bold text-[#3E2A2D]">
                    <Sparkles className="w-4 h-4 text-[#FF5C8D]" />
                    <span>Tóm tắt thiệp sẽ gắn vào hộp quà</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-[#FFF9F5] border border-[#F2DCE2]">
                    {selectedTemplate && (
                      <img
                        src={selectedTemplate.previewUrl}
                        alt={selectedTemplate.title}
                        className="w-16 h-12 rounded-lg object-cover border border-[#F2DCE2]"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#3E2A2D] truncate">
                        {selectedTemplate?.title || templateSlug}
                      </p>
                      <p className="text-[11px] text-[#7C6368]">
                        Gửi: {senderName || "Bạn"} → Nhận: {recipientName || "Người thương"}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-[#3E2A2D] bg-[#FDF9F6] rounded-xl p-3 border border-[#F2DCE2] space-y-1">
                    <p className="font-semibold">{title || "Lời chúc gửi người thương"}</p>
                    <p className="text-[#7C6368] whitespace-pre-line line-clamp-4">
                      {message || "Gửi bạn chút mềm mại và lời chúc bình an."}
                    </p>
                  </div>
                  <div className="space-y-1 text-xs text-[#7C6368] pt-2 border-t border-[#F2DCE2]">
                    <div className="flex justify-between">
                      <span>Ảnh kỷ niệm đính kèm</span>
                      <span className="font-semibold text-[#3E2A2D]">{photoUrls.length} ảnh</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Thời hạn lưu giữ</span>
                      <span className="font-semibold text-[#3E2A2D]">
                        {selectedPlan?.priceVnd ? formatVnd(selectedPlan.priceVnd) : "Kèm sẵn 90 ngày"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hình thức gói quà</span>
                      <span className="font-semibold text-[#3E2A2D]">
                        {selectedWrap?.priceVnd ? formatVnd(selectedWrap.priceVnd) : "Tiêu chuẩn (0đ)"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Wizard Navigation */}
        <div className="bg-white px-4 sm:px-6 py-3.5 border-t border-[#F2DCE2] flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => (step > 1 ? setStep((step - 1) as 1 | 2 | 3 | 4) : onClose())}
            className="ddg-shop-btn-secondary px-4 py-2.5 text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{step === 1 ? "Hủy" : "Quay lại"}</span>
          </button>

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((step + 1) as 1 | 2 | 3 | 4)}
              className="ddg-shop-btn-primary px-6 py-2.5 text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <span>Tiếp tục bước {step + 1}/4</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePersistAndFinish}
              disabled={saving}
              className="ddg-shop-btn-primary px-6 py-2.5 text-xs font-semibold inline-flex items-center gap-2 disabled:opacity-60"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? "Đang lưu thiệp..." : "Lưu & Gắn thiệp vào hộp quà"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

