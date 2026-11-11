"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Download,
  RotateCcw,
  Plus,
  Trash2,
  Sparkles,
  Palette,
  Type,
  Smile,
  Upload,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Loader2,
  Check,
  AlertTriangle,
} from "lucide-react";
import { QR_PRESETS, QrPreset } from "@/lib/qr/presets";
import { QrDesign, QrText, QrIcon } from "@/lib/qr/types";
import { renderQrArtworkToCanvas } from "@/lib/qr/canvasRenderer";
import FollowPromptModal from "./FollowPromptModal";

const ICON_PALETTE = [
  "❤️", "💖", "💕", "🌹", "🌸", "💐", "✨", "⭐", "🎉", "🎁",
  "🎂", "🎈", "🧸", "💌", "💍", "👑", "🔥", "🦋", "🍾", "🍷",
  "🎄", "🐾", "🐶", "😊", "😍", "🏮", "🌕", "🍫", "🍬", "🏹",
];

const QUICK_TEXTS = [
  "Anh yêu em ❤️",
  "Mãi bên nhau",
  "Happy Birthday 🎂",
  "Gửi người thương",
  "Merry Christmas 🎄",
  "Trung thu vui vẻ 🏮",
];

const FONT_OPTIONS = [
  { label: "Serif Cổ Điển", value: "serif" },
  { label: "Sans Hiện Đại", value: "sans-serif" },
  { label: "Viết Tay / Thư Pháp", value: "'Dancing Script', cursive, serif" },
  { label: "Monospace", value: "monospace" },
];

const TEXT_STYLES = [
  { id: "white_shadow", label: "Chữ trắng", color: "#ffffff", hasBg: false },
  { id: "dark_card", label: "Nền tối / Chữ sáng", color: "#ffffff", hasBg: true, bg: "rgba(0,0,0,0.75)" },
  { id: "pink_card", label: "Nền hồng / Chữ sáng", color: "#ffffff", hasBg: true, bg: "rgba(225,29,72,0.85)" },
  { id: "white_card", label: "Nền trắng / Chữ tối", color: "#1e1e24", hasBg: true, bg: "rgba(255,255,255,0.92)" },
  { id: "gold_text", label: "Chữ vàng ánh kim", color: "#fde047", hasBg: false },
  { id: "rose_text", label: "Chữ hồng", color: "#fb7185", hasBg: false },
];

const COLOR_SWATCHES = [
  "#ff2a5f", "#e11d48", "#db2777", "#9333ea", "#33FFC2", "#3b82f6",
  "#10b981", "#f59e0b", "#fbbf24", "#000000", "#ffffff", "#64748b",
];

interface QrDesignerProps {
  giftId: string;
  publicUrl: string;
  slug: string;
  cardTitle?: string;
}

export default function QrDesigner({ giftId, publicUrl, slug, cardTitle }: QrDesignerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [activeTab, setActiveTab] = useState<"text" | "icon" | "style">("text");
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragType, setDragType] = useState<"text" | "icon" | null>(null);

  // QR Design State
  const [design, setDesign] = useState<QrDesign>({
    giftId,
    presetId: QR_PRESETS[0].id,
    moduleColor: QR_PRESETS[0].defaultModuleColor,
    texts: [],
    icons: [],
    revision: 1,
  });

  const activePreset = QR_PRESETS.find((p) => p.id === design.presetId) || QR_PRESETS[0];

  // Load saved design from server
  useEffect(() => {
    fetch(`/api/v1/invitations/${giftId}/qr-design`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.qrDesign) {
          setDesign(data.data.qrDesign);
          if (data.data.qrDesign.texts?.length > 0) {
            setSelectedTextId(data.data.qrDesign.texts[0].id);
          }
        }
      })
      .catch((err) => console.error("Error loading QR design:", err));
  }, [giftId]);

  // Autosave design to server (debounced)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveDesignToServer = useCallback(
    (newDesign: QrDesign) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      setSaveState("saving");
      saveTimeoutRef.current = setTimeout(() => {
        fetch(`/api/v1/invitations/${giftId}/qr-design`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newDesign),
        })
          .then((res) => {
            if (res.ok) setSaveState("saved");
            else setSaveState("idle");
          })
          .catch((err) => {
            console.error("Failed to autosave QR design:", err);
            setSaveState("idle");
          });
      }, 650);
    },
    [giftId]
  );

  const updateDesign = (updater: (prev: QrDesign) => QrDesign) => {
    setDesign((prev) => {
      const next = updater(prev);
      saveDesignToServer(next);
      return next;
    });
  };

  // Re-draw canvas preview whenever design, preset, or card title changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    renderQrArtworkToCanvas(canvas, design, publicUrl, {
      exportScale: 0.6, // 600px preview
      showHandles: true,
      selectedItemId: selectedTextId || selectedIconId,
      cardTitle,
    });
  }, [design, publicUrl, selectedTextId, selectedIconId, cardTitle]);

  // Selected Text & Icon references
  const selectedText = design.texts.find((t) => t.id === selectedTextId) || design.texts[0];
  const selectedIcon = design.icons.find((i) => i.id === selectedIconId);

  // Preset switch
  const handleSelectPreset = (preset: QrPreset) => {
    updateDesign((prev) => ({
      ...prev,
      presetId: preset.id,
      moduleColor: preset.defaultModuleColor,
    }));
  };

  // Add new text
  const handleAddText = () => {
    const newId = `txt_${Date.now()}`;
    const newText: QrText = {
      id: newId,
      text: "Lời chúc của bạn ✨",
      x: 500,
      y: 780,
      rotation: 0,
      fontFamily: "serif",
      fontSize: 38,
      color: "#ffffff",
      hasBackground: false,
      align: "center",
      zIndex: design.texts.length + 1,
    };
    updateDesign((prev) => ({
      ...prev,
      texts: [...prev.texts, newText],
    }));
    setSelectedTextId(newId);
    setActiveTab("text");
  };

  // Delete text
  const handleDeleteText = (id: string) => {
    updateDesign((prev) => ({
      ...prev,
      texts: prev.texts.filter((t) => t.id !== id),
    }));
    if (selectedTextId === id) {
      const remaining = design.texts.filter((t) => t.id !== id);
      setSelectedTextId(remaining[0]?.id || null);
    }
  };

  // Add new icon
  const handleAddIcon = (emoji: string) => {
    const newId = `ic_${Date.now()}`;
    const newIcon: QrIcon = {
      id: newId,
      emoji,
      x: 500 + (Math.random() - 0.5) * 300,
      y: 200 + (Math.random() - 0.5) * 100,
      size: 48,
      rotation: (Math.random() - 0.5) * 20,
      zIndex: design.icons.length + 1,
    };
    updateDesign((prev) => ({
      ...prev,
      icons: [...prev.icons, newIcon],
    }));
    setSelectedIconId(newId);
    setActiveTab("icon");
  };

  // Delete icon
  const handleDeleteIcon = (id: string) => {
    updateDesign((prev) => ({
      ...prev,
      icons: prev.icons.filter((i) => i.id !== id),
    }));
    if (selectedIconId === id) setSelectedIconId(null);
  };

  // Custom background upload
  const handleUploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("invitationId", giftId);

      const res = await fetch("/api/v1/assets/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.data?.url) {
        updateDesign((prev) => ({
          ...prev,
          backgroundUrl: data.data.url,
          backgroundFit: "cover",
        }));
      }
    } catch (err) {
      console.error(err);
      alert("Lỗi tải ảnh nền.");
    }
  };

  // Reset to default
  const handleResetDefaults = () => {
    if (!confirm("Khôi phục màu mã QR và ảnh nền về mặc định của mẫu khung này?")) return;
    updateDesign((prev) => ({
      ...prev,
      moduleColor: activePreset.defaultModuleColor,
      backgroundUrl: undefined,
    }));
  };

  // Canvas Drag Handling (reposition text or icon)
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = 1000 / rect.width;
    const scaleY = 1000 / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Check hit on icons (radius ~ 40px)
    for (const ic of [...design.icons].reverse()) {
      const dist = Math.hypot(ic.x - clickX, ic.y - clickY);
      if (dist < ic.size) {
        setSelectedIconId(ic.id);
        setSelectedTextId(null);
        setActiveTab("icon");
        setIsDragging(true);
        setDraggedItemId(ic.id);
        setDragType("icon");
        return;
      }
    }

    // Check hit on texts
    for (const txt of [...design.texts].reverse()) {
      const dist = Math.hypot(txt.x - clickX, txt.y - clickY);
      if (dist < 100) {
        setSelectedTextId(txt.id);
        setSelectedIconId(null);
        setActiveTab("text");
        setIsDragging(true);
        setDraggedItemId(txt.id);
        setDragType("text");
        return;
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !draggedItemId || !dragType) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = 1000 / rect.width;
    const scaleY = 1000 / rect.height;
    const curX = Math.round((e.clientX - rect.left) * scaleX);
    const curY = Math.round((e.clientY - rect.top) * scaleY);

    if (dragType === "text") {
      updateDesign((prev) => ({
        ...prev,
        texts: prev.texts.map((t) =>
          t.id === draggedItemId ? { ...t, x: Math.max(50, Math.min(curX, 950)), y: Math.max(50, Math.min(curY, 950)) } : t
        ),
      }));
    } else if (dragType === "icon") {
      updateDesign((prev) => ({
        ...prev,
        icons: prev.icons.map((i) =>
          i.id === draggedItemId ? { ...i, x: Math.max(50, Math.min(curX, 950)), y: Math.max(50, Math.min(curY, 950)) } : i
        ),
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setDraggedItemId(null);
    setDragType(null);
  };

  // High-Resolution PNG Export (1200x1200px) & Verification
  const handleExportPng = async () => {
    setExporting(true);
    setToastMessage(null);

    try {
      const offscreen = document.createElement("canvas");
      // Render at 1.2x scale (1200x1200px high resolution) without selection handles
      const result = await renderQrArtworkToCanvas(offscreen, design, publicUrl, {
        exportScale: 1.2,
        showHandles: false,
        cardTitle,
      });

      if (!result.success) {
        throw new Error(result.error || "Không thể khởi tạo ảnh QR.");
      }

      // Convert canvas to blob
      offscreen.toBlob((blob) => {
        if (!blob) {
          alert("Lỗi khi tạo tệp ảnh.");
          setExporting(false);
          return;
        }

        // Trigger file download
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `qr-thiep-moi-${slug || "card"}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        setToastMessage("Ảnh QR đã tải về máy thành công!");
        setExporting(false);

        // Open follow prompt modal smoothly after download
        setTimeout(() => {
          setShowFollowModal(true);
        }, 600);
      }, "image/png");
    } catch (err: any) {
      alert(err.message || "Đã xảy ra lỗi xuất ảnh.");
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Preset Selector */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Mẫu khung QR ({QR_PRESETS.length})
            </label>
            {saveState === "saving" && (
              <span className="text-[11px] font-medium text-amber-600">Đang lưu...</span>
            )}
            {saveState === "saved" && (
              <span className="text-[11px] font-medium text-emerald-600 inline-flex items-center gap-0.5">
                <Check className="w-3 h-3" /> Đã lưu mẫu QR
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400">Cuộn ngang để xem thêm</span>
        </div>

        {/* Horizontal Preset Strip */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {QR_PRESETS.map((p) => {
            const isSelected = p.id === design.presetId;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p)}
                className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-semibold transition-all ${isSelected
                    ? "bg-rose-50 border-rose-500 text-rose-700 shadow-xs ring-2 ring-rose-200"
                    : "bg-white border-slate-200/80 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                  }`}
              >
                <span className="text-base">{p.icon}</span>
                <span className="whitespace-nowrap">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive Canvas Preview (Artboard) */}
      <div className="flex flex-col items-center">
        <div className="relative w-full max-w-[380px] aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900 bg-black cursor-crosshair">
          <canvas
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            className="w-full h-full object-contain block select-none"
          />

          {/* Guide hint */}
          <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
            <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-[10px] text-white/80 font-medium">
              Kéo thả chữ hoặc icon trực tiếp trên khung
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 mt-2 text-center">
          {activePreset.description}
        </p>
      </div>

      {/* 3. Three Tab Controls (Lời chúc / Icon / Nền & màu) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Tabs Bar */}
        <div className="grid grid-cols-3 border-b border-slate-100 text-xs font-bold bg-slate-50/60 p-1 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("text")}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${activeTab === "text"
                ? "bg-white text-rose-600 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
              }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Lời chúc</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("icon")}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${activeTab === "icon"
                ? "bg-white text-rose-600 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
              }`}
          >
            <Smile className="w-3.5 h-3.5" />
            <span>Icon ({design.icons.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("style")}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 ${activeTab === "style"
                ? "bg-white text-rose-600 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
              }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Nền &amp; Màu</span>
          </button>
        </div>

        {/* Panel 1: Lời chúc (Text Objects) */}
        {activeTab === "text" && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Quick text chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Câu chúc nhanh
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TEXTS.map((phrase) => (
                  <button
                    key={phrase}
                    type="button"
                    onClick={() => {
                      if (selectedText) {
                        updateDesign((prev) => ({
                          ...prev,
                          texts: prev.texts.map((t) =>
                            t.id === selectedText.id ? { ...t, text: phrase } : t
                          ),
                        }));
                      } else {
                        handleAddText();
                      }
                    }}
                    className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-[11px] font-medium transition"
                  >
                    {phrase}
                  </button>
                ))}
              </div>
            </div>

            {/* List of text items with Add button */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Dòng chữ trên ảnh ({design.texts.length}):
                </label>
                <button
                  type="button"
                  onClick={handleAddText}
                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm dòng chữ</span>
                </button>
              </div>

              {/* Text item pills */}
              <div className="flex flex-wrap gap-1.5">
                {design.texts.map((t, idx) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTextId(t.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition flex items-center gap-2 border ${selectedTextId === t.id
                        ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                  >
                    <span className="line-clamp-1 max-w-[120px]">{t.text || `Dòng chữ ${idx + 1}`}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Controls for Selected Text */}
            {selectedText && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3.5">
                {/* Text Content */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nội dung chữ:
                  </label>
                  <textarea
                    rows={2}
                    value={selectedText.text}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateDesign((prev) => ({
                        ...prev,
                        texts: prev.texts.map((t) =>
                          t.id === selectedText.id ? { ...t, text: val } : t
                        ),
                      }));
                    }}
                    placeholder="Nhập lời chúc..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-200"
                  />
                </div>

                {/* Style Presets */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Kiểu chữ:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {TEXT_STYLES.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          updateDesign((prev) => ({
                            ...prev,
                            texts: prev.texts.map((t) =>
                              t.id === selectedText.id
                                ? {
                                  ...t,
                                  color: st.color,
                                  hasBackground: st.hasBg,
                                  backgroundColor: st.bg,
                                }
                                : t
                            ),
                          }));
                        }}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 hover:border-rose-400 transition"
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font & Alignment */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Phông chữ:
                    </label>
                    <select
                      value={selectedText.fontFamily}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateDesign((prev) => ({
                          ...prev,
                          texts: prev.texts.map((t) =>
                            t.id === selectedText.id ? { ...t, fontFamily: val } : t
                          ),
                        }));
                      }}
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-300 bg-white"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Căn lề:
                    </label>
                    <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-300">
                      {(["left", "center", "right"] as const).map((al) => (
                        <button
                          key={al}
                          type="button"
                          onClick={() => {
                            updateDesign((prev) => ({
                              ...prev,
                              texts: prev.texts.map((t) =>
                                t.id === selectedText.id ? { ...t, align: al } : t
                              ),
                            }));
                          }}
                          className={`flex-1 py-1 rounded-lg flex items-center justify-center transition ${selectedText.align === al
                              ? "bg-rose-100 text-rose-700 font-bold"
                              : "text-slate-400 hover:text-slate-700"
                            }`}
                        >
                          {al === "left" && <AlignLeft className="w-3.5 h-3.5" />}
                          {al === "center" && <AlignCenter className="w-3.5 h-3.5" />}
                          {al === "right" && <AlignRight className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Font Size & Rotation Sliders */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>Cỡ chữ:</span>
                      <span className="font-mono">{selectedText.fontSize}px</span>
                    </div>
                    <input
                      type="range"
                      min={16}
                      max={90}
                      value={selectedText.fontSize}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        updateDesign((prev) => ({
                          ...prev,
                          texts: prev.texts.map((t) =>
                            t.id === selectedText.id ? { ...t, fontSize: val } : t
                          ),
                        }));
                      }}
                      className="w-full accent-rose-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>Xoay:</span>
                      <span className="font-mono">{selectedText.rotation}°</span>
                    </div>
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      value={selectedText.rotation}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        updateDesign((prev) => ({
                          ...prev,
                          texts: prev.texts.map((t) =>
                            t.id === selectedText.id ? { ...t, rotation: val } : t
                          ),
                        }));
                      }}
                      className="w-full accent-rose-600"
                    />
                  </div>
                </div>

                {/* Color Swatches */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Màu chữ:
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    {COLOR_SWATCHES.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => {
                          updateDesign((prev) => ({
                            ...prev,
                            texts: prev.texts.map((t) =>
                              t.id === selectedText.id ? { ...t, color: hex } : t
                            ),
                          }));
                        }}
                        style={{ backgroundColor: hex }}
                        className={`w-6 h-6 rounded-full border shadow-xs transition-transform hover:scale-110 ${selectedText.color === hex ? "ring-2 ring-rose-500 ring-offset-1" : ""
                          }`}
                      />
                    ))}
                    <input
                      type="color"
                      value={selectedText.color}
                      onChange={(e) => {
                        const hex = e.target.value;
                        updateDesign((prev) => ({
                          ...prev,
                          texts: prev.texts.map((t) =>
                            t.id === selectedText.id ? { ...t, color: hex } : t
                          ),
                        }));
                      }}
                      className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent"
                    />
                  </div>
                </div>

                {/* Delete Button */}
                <div className="pt-2 border-t border-slate-200/80 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleDeleteText(selectedText.id)}
                    className="px-3 py-1.5 rounded-xl text-xs text-rose-600 hover:bg-rose-100/60 font-semibold flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa dòng chữ này</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Panel 2: Icon Objects */}
        {activeTab === "icon" && (
          <div className="p-4 sm:p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Bấm vào icon để thêm lên ảnh:
              </label>
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                {ICON_PALETTE.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleAddIcon(emoji)}
                    className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200/80 text-xl flex items-center justify-center transition hover:scale-110 shadow-xs"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Icon Controls */}
            {selectedIcon && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">
                    Icon đang chọn: <strong className="text-base">{selectedIcon.emoji}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteIcon(selectedIcon.id)}
                    className="text-xs text-rose-600 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>Kích cỡ:</span>
                      <span className="font-mono">{selectedIcon.size}px</span>
                    </div>
                    <input
                      type="range"
                      min={24}
                      max={96}
                      value={selectedIcon.size}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        updateDesign((prev) => ({
                          ...prev,
                          icons: prev.icons.map((ic) =>
                            ic.id === selectedIcon.id ? { ...ic, size: val } : ic
                          ),
                        }));
                      }}
                      className="w-full accent-rose-600"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
                      <span>Xoay:</span>
                      <span className="font-mono">{selectedIcon.rotation}°</span>
                    </div>
                    <input
                      type="range"
                      min={-180}
                      max={180}
                      value={selectedIcon.rotation}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        updateDesign((prev) => ({
                          ...prev,
                          icons: prev.icons.map((ic) =>
                            ic.id === selectedIcon.id ? { ...ic, rotation: val } : ic
                          ),
                        }));
                      }}
                      className="w-full accent-rose-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Panel 3: Nền & Màu QR */}
        {activeTab === "style" && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Custom Background Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                Ảnh nền khung QR:
              </label>
              <div className="flex items-center gap-3">
                {design.backgroundUrl && (
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border">
                    <img src={design.backgroundUrl} alt="Custom BG" className="w-full h-full object-cover" />
                  </div>
                )}
                <label className="cursor-pointer px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center gap-1.5 shadow-xs transition">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{design.backgroundUrl ? "Đổi ảnh nền" : "Tải ảnh nền riêng"}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleUploadBg}
                  />
                </label>
                {design.backgroundUrl && (
                  <button
                    type="button"
                    onClick={() =>
                      updateDesign((prev) => ({ ...prev, backgroundUrl: undefined }))
                    }
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Gỡ nền
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Ảnh nền QR chỉ dùng cho khung ảnh chia sẻ, không thay thế ảnh trong thiệp.
              </p>
            </div>

            {/* QR Module Color */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700">
                Màu mã QR:
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {COLOR_SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => updateDesign((prev) => ({ ...prev, moduleColor: hex }))}
                    style={{ backgroundColor: hex }}
                    className={`w-7 h-7 rounded-full border shadow-xs transition-transform hover:scale-110 ${design.moduleColor === hex ? "ring-2 ring-rose-500 ring-offset-2" : ""
                      }`}
                  />
                ))}
                <div className="flex items-center gap-1.5 pl-2">
                  <input
                    type="color"
                    value={design.moduleColor}
                    onChange={(e) =>
                      updateDesign((prev) => ({ ...prev, moduleColor: e.target.value }))
                    }
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <span className="font-mono text-xs font-bold text-slate-700 uppercase">
                    {design.moduleColor}
                  </span>
                </div>
              </div>
            </div>

            {/* Contrast check notice */}
            {design.moduleColor === "#ffffff" && activePreset.backgroundType === "light" && (
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Màu QR này có thể khó quét trên nền sáng. Khuyên dùng màu tương phản cao hơn.</span>
              </div>
            )}

            {/* Reset to defaults */}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3.5 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Khôi phục mặc định</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Main Export CTA Button */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleExportPng}
          disabled={exporting}
          data-testid="export-qr-btn"
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-[#e93459] hover:opacity-95 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-rose-200 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
        >
          {exporting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Đang tạo ảnh phân giải cao...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>Tải ảnh QR (Độ nét cao 1200px)</span>
            </>
          )}
        </button>

        <p className="text-[11px] text-slate-400 text-center">
          Ảnh tải về giống bản xem trước phía trên, quét được 100% bằng camera điện thoại.
        </p>

        {toastMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-center gap-1.5 animate-in fade-in">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* Follow Prompt Modal */}
      <FollowPromptModal
        isOpen={showFollowModal}
        onClose={() => setShowFollowModal(false)}
      />
    </div>
  );
}

