"use client";

import { useState } from "react";
import { X, Copy, Check, CheckCircle2, Sparkles, ExternalLink } from "lucide-react";
import { BrandMark } from "@/components/common/BrandLogo";
import ModalShell from "./ModalShell";
import { VOUCHER_CAMPAIGN } from "@/data/catalogData";

interface VoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoucherModal({ isOpen, onClose }: VoucherModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedHashtags, setCopiedHashtags] = useState(false);

  const campaign = VOUCHER_CAMPAIGN;

  const copyToClipboard = async (text: string, setStatus: (v: boolean) => void) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setStatus(true);
      setTimeout(() => setStatus(false), 2200);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      titleId="voucher-modal-title"
      maxWidthClass="max-w-[540px]"
    >
      <div className="flex flex-col max-h-[calc(100dvh-32px)]">
        {/* Header Panel */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#ffedf0] border-b border-rose-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <BrandMark size="sm" surface="white-card" />
            <div>
              <h2
                id="voucher-modal-title"
                className="text-base sm:text-lg font-bold text-[#e93459]"
              >
                {campaign.title}
              </h2>
              <p className="text-[11px] text-slate-500">Mã ưu đãi độc quyền trên hệ thống Ding Dong Gift</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng popup ưu đãi"
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto text-slate-800 text-xs sm:text-sm">
          {/* Nhiệm vụ 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-[13px] sm:text-[14px]">
              <span className="w-5 h-5 rounded-full bg-rose-100 text-[#fa416a] inline-flex items-center justify-center text-xs">
                1
              </span>
              <span>{campaign.task1.title}</span>
            </div>

            <ul className="space-y-1.5 pl-7 text-slate-600 text-xs">
              {campaign.task1.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>

            {/* Voucher Code Box */}
            <div className="ml-7 flex items-center justify-between p-3 bg-rose-50/70 border border-dashed border-[#fa416a]/50 rounded-xl">
              <div>
                <span className="block text-[10px] uppercase font-bold text-rose-500 tracking-wider">
                  Mã voucher ưu đãi
                </span>
                <span className="text-base font-mono font-bold text-slate-900 tracking-wider">
                  {campaign.code}
                </span>
              </div>
              <button
                type="button"
                onClick={() => copyToClipboard(campaign.code, setCopiedCode)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#ff6b61] to-[#fa416a] hover:opacity-95 text-white text-xs font-semibold rounded-lg shadow-xs transition-transform active:scale-95"
              >
                {copiedCode ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép mã</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-3" />

          {/* Nhiệm vụ 2 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-[13px] sm:text-[14px]">
              <span className="w-5 h-5 rounded-full bg-rose-100 text-[#fa416a] inline-flex items-center justify-center text-xs">
                2
              </span>
              <span>{campaign.task2.title}</span>
            </div>

            <ul className="space-y-1.5 pl-7 text-slate-600 text-xs">
              {campaign.task2.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>

            {/* Video Caption Box */}
            <div className="ml-7 space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-700">Mô tả video (copy):</span>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl gap-2">
                <p className="text-xs text-slate-600 italic line-clamp-2 leading-relaxed">
                  {campaign.videoCaption}
                </p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(campaign.videoCaption, setCopiedCaption)}
                  title="Sao chép mô tả video"
                  className="p-1.5 text-slate-500 hover:text-[#fa416a] hover:bg-white rounded-md shrink-0 border border-slate-200"
                >
                  {copiedCaption ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Hashtags Chips */}
            <div className="ml-7 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-700">Hashtag chiến dịch:</span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(campaign.hashtags.join(" "), setCopiedHashtags)
                  }
                  className="text-[11px] text-[#fa416a] hover:underline font-medium inline-flex items-center gap-1"
                >
                  {copiedHashtags ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600">Đã chép hashtag</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Sao chép tất cả</span>
                    </>
                  )}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {campaign.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-[#fff0f3] text-[#fa416a] text-[11px] font-medium rounded-full border border-rose-200/60"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Cách nhận thưởng Box */}
          <div className="p-3.5 bg-[#fff3cd] border border-amber-300/80 rounded-xl text-amber-900 space-y-1.5">
            <h4 className="text-xs font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Cách nhận thưởng & Kích hoạt</span>
            </h4>
            <div className="space-y-1 text-[11px] leading-relaxed text-amber-900/90 pl-1">
              {campaign.redemptionSteps.map((step, idx) => (
                <p key={idx}>{step}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Footer CTAs */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 px-6 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors"
          >
            Đóng
          </button>

          <a
            href={campaign.tiktokUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 bg-black hover:bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
          >
            <span>Đi tới TikTok</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </ModalShell>
  );
}

