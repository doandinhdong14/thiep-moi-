"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronUp,
  Clock,
  Copy,
  Headphones,
  Mail,
  MessageCircleHeart,
  PackageSearch,
  Phone,
  Send,
  ShoppingBag,
  X,
} from "lucide-react";
import { useOptionalShopCart } from "@/components/shop/ShopCartContext";

const SUPPORT_EMAIL = "hotro@dingdonggift.vn";
const SUPPORT_HOTLINE = "1900 8888";
const SUPPORT_HOURS = "08:30 – 22:00 (T2 – CN)";

const QUICK_TOPICS = [
  "Tư vấn chọn quà",
  "Đơn hàng & Giao nhận",
  "Hỗ trợ thiệp QR",
] as const;

/**
 * Responsive bottom-right circular Contact widget + Back-to-Top button.
 * Renders a compact popover card on desktop/tablet and a touch-friendly bottom sheet on mobile (320px+).
 */
export default function FloatingWidgets() {
  const shopCart = useOptionalShopCart();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isIframe, setIsIframe] = useState(false);
  const [open, setOpen] = useState(false);

  const [copiedField, setCopiedField] = useState<"phone" | "email" | "draft" | null>(null);
  const [topic, setTopic] = useState<string>(QUICK_TOPICS[0]);
  const [senderContact, setSenderContact] = useState("");
  const [messageText, setMessageText] = useState("");
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const p = window.location.pathname || "";
      if (
        window.location.search.includes("embed=true") ||
        p.startsWith("/templates/") ||
        p.startsWith("/i/") ||
        p.startsWith("/mo-qua/")
      ) {
        setIsIframe(true);
        return;
      }
    }

    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 320);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  // Close contact popup if cart drawer opens so overlays never stack confusingly
  useEffect(() => {
    if (shopCart?.drawerOpen && open) {
      setOpen(false);
    }
  }, [shopCart?.drawerOpen, open]);

  const handleCopy = async (value: string, field: "phone" | "email" | "draft") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // ignore clipboard errors in restricted browsers
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMsg = messageText.trim();
    if (!trimmedMsg) return;

    const contactLine = senderContact.trim() || "Khách truy cập website";
    const formattedText = `[${topic}] Liên hệ: ${contactLine}\nNội dung: ${trimmedMsg}`;
    await handleCopy(formattedText, "draft");

    const subject = encodeURIComponent(`[DingDong Gift] ${topic}`);
    const body = encodeURIComponent(formattedText);
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

    setSubmitNotice(
      "Đã mở trình gửi email kèm nội dung bạn vừa soạn (đồng thời sao chép sẵn vào bộ nhớ tạm).",
    );
    setMessageText("");
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isIframe) return null;

  return (
    <aside aria-label="Kênh liên hệ và hỗ trợ khách hàng">
      {/* Mobile Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[2px] sm:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Responsive Contact Panel (Bottom Sheet on mobile, Floating Card on desktop) */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="false"
          aria-label="Liên hệ DingDong Gift"
          className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:right-6 sm:bottom-[88px] z-50 sm:w-[360px] max-w-[calc(100vw-1.5rem)] max-h-[82dvh] sm:max-h-[calc(100dvh-7.5rem)] flex flex-col rounded-3xl sm:rounded-2xl bg-white border border-rose-100 shadow-[0_22px_55px_rgba(15,23,42,0.18)] overflow-hidden"
        >
          {/* Mobile sheet handle */}
          <div className="sm:hidden bg-gradient-to-r from-[#ff6b61] to-[#fa416a] pt-2 pb-0.5 flex justify-center">
            <span className="w-10 h-1 rounded-full bg-white/50" />
          </div>

          {/* Header */}
          <div className="bg-gradient-to-r from-[#ff6b61] to-[#fa416a] text-white px-4 py-3.5 flex items-start justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <Headphones className="w-4 h-4 text-white" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-bold leading-tight truncate">
                  Liên hệ DingDong Gift
                </h2>
                <p className="text-[11px] text-white/90 inline-flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 shrink-0" />
                  <span>Tư vấn &amp; CSKH nhanh</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng khung liên hệ"
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto p-4 space-y-3.5 text-slate-700">
            {/* Direct Channels */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 rounded-xl border border-rose-100 bg-[#FFF9FA] px-3 py-2.5">
                <a
                  href={`tel:${SUPPORT_HOTLINE.replace(/\s+/g, "")}`}
                  className="flex items-center gap-2.5 min-w-0 flex-1 group"
                >
                  <span className="w-8 h-8 rounded-full bg-rose-100 text-[#fa416a] flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-500 font-medium">Hotline hỗ trợ</p>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-[#fa416a] transition-colors">
                      {SUPPORT_HOTLINE}
                    </p>
                  </div>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(SUPPORT_HOTLINE, "phone")}
                  aria-label="Sao chép số hotline"
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-rose-100 text-[11px] font-semibold text-slate-600 hover:text-[#fa416a] inline-flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copiedField === "phone" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Chép</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 rounded-xl border border-rose-100 bg-[#FFF9FA] px-3 py-2.5">
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Hỗ trợ DingDong Gift")}`}
                  className="flex items-center gap-2.5 min-w-0 flex-1 group"
                >
                  <span className="w-8 h-8 rounded-full bg-rose-100 text-[#fa416a] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-500 font-medium">Email CSKH</p>
                    <p className="text-xs font-bold text-slate-900 truncate group-hover:text-[#fa416a] transition-colors">
                      {SUPPORT_EMAIL}
                    </p>
                  </div>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(SUPPORT_EMAIL, "email")}
                  aria-label="Sao chép email hỗ trợ"
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-rose-100 text-[11px] font-semibold text-slate-600 hover:text-[#fa416a] inline-flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copiedField === "email" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-700">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Chép</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 px-1">
                <Clock className="w-3.5 h-3.5 text-[#ff6b61] shrink-0" />
                <span>Giờ làm việc: {SUPPORT_HOURS}</span>
              </div>
            </div>

            {/* Quick Shortcuts */}
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/qua-tang/tra-cuu-don"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50/50 text-xs font-semibold text-slate-700 transition-colors"
              >
                <PackageSearch className="w-3.5 h-3.5 text-[#fa416a]" />
                <span>Tra cứu đơn</span>
              </Link>
              {shopCart ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    shopCart.openDrawer("orders");
                  }}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50/50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-[#fa416a]" />
                  <span>Đơn của tôi</span>
                </button>
              ) : (
                <Link
                  href="/qua-tang/gio-hang?tab=orders"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:border-rose-200 hover:bg-rose-50/50 text-xs font-semibold text-slate-700 transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-[#fa416a]" />
                  <span>Đơn của tôi</span>
                </Link>
              )}
            </div>

            {/* Quick Inquiry Form */}
            <form
              onSubmit={handleSendMessage}
              className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 space-y-2.5"
            >
              <p className="text-xs font-bold text-slate-800">Gửi lời nhắn nhanh</p>

              <div className="flex flex-wrap gap-1.5">
                {QUICK_TOPICS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setTopic(item)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                      topic === item
                        ? "bg-[#fa416a] text-white"
                        : "bg-white border border-slate-200 text-slate-600 hover:border-rose-200"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={senderContact}
                onChange={(e) => setSenderContact(e.target.value)}
                placeholder="Tên / SĐT hoặc Email của bạn"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#fa416a]"
              />
              <textarea
                rows={2}
                required
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  if (submitNotice) setSubmitNotice(null);
                }}
                placeholder="Bạn cần tư vấn sản phẩm, thiệp QR hay mã đơn nào?"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#fa416a] resize-none"
              />

              {submitNotice && (
                <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 leading-relaxed">
                  {submitNotice}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#ff6b61] to-[#fa416a] hover:opacity-95 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-xs transition-opacity cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi email hỗ trợ ngay</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Back to Top Button (sits centered above Contact circle when scrolled) */}
      {showBackToTop && !open && (
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Cuộn lên đầu trang"
          title="Lên đầu trang"
          className="fixed right-[18px] bottom-[72px] sm:right-7 sm:bottom-[88px] z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 backdrop-blur-xs border border-rose-200 text-[#fa416a] flex items-center justify-center shadow-lg transition-all hover:bg-rose-50 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <ChevronUp className="w-5 h-5 stroke-[2.4]" />
        </button>
      )}

      {/* Primary Circular Floating Contact Button (bottom-right) */}
      <button
        ref={triggerRef}
        id="ddg-floating-contact-btn"
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? "Đóng liên hệ hỗ trợ" : "Mở liên hệ hỗ trợ"}
        title="Liên hệ & Hỗ trợ"
        className={`fixed right-4 bottom-4 sm:right-6 sm:bottom-6 z-40 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-[#ff6b61] to-[#fa416a] text-white flex items-center justify-center ring-4 ring-white/90 shadow-[0_10px_28px_rgba(250,65,106,0.38)] transition-all hover:scale-105 active:scale-95 cursor-pointer group ${
          open ? "hidden sm:flex" : "flex"
        }`}
      >
        {/* Subtle motion-safe halo when idle */}
        {!open && (
          <span
            aria-hidden="true"
            className="motion-safe:animate-ping absolute inset-0 rounded-full bg-[#fa416a]/30 pointer-events-none"
          />
        )}

        <span className="relative flex items-center justify-center">
          {open ? (
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          ) : (
            <MessageCircleHeart className="w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:scale-105" />
          )}
        </span>

        {/* Desktop hover label tooltip */}
        {!open && (
          <span className="hidden lg:flex items-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity absolute right-full mr-3 px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-semibold whitespace-nowrap shadow-md">
            Liên hệ hỗ trợ
          </span>
        )}
      </button>
    </aside>
  );
}
