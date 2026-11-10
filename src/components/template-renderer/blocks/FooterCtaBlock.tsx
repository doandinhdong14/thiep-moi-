"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Gift, AlertTriangle, Sparkles, Check } from "lucide-react";
import { TemplateTheme } from "@/lib/templates/registry";

interface FooterCtaBlockProps {
  giftTransferInfo?: {
    enabled?: boolean;
    bankName?: string;
    accountNumber?: string;
    accountHolder?: string;
    qrImageUrl?: string;
  };
  slug?: string;
  theme: TemplateTheme;
}

export default function FooterCtaBlock({
  giftTransferInfo,
  slug,
  theme,
}: FooterCtaBlockProps) {
  const [showGift, setShowGift] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAccount = () => {
    if (giftTransferInfo?.accountNumber) {
      navigator.clipboard.writeText(giftTransferInfo.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="mt-12 mb-8 text-center px-4 max-w-lg mx-auto space-y-6">
      {/* Optional Gift Transfer Info */}
      {giftTransferInfo?.enabled && (
        <div>
          {!showGift ? (
            <button
              onClick={() => setShowGift(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all hover:scale-105"
              style={{
                backgroundColor: `${theme.accent}10`,
                borderColor: `${theme.accent}30`,
                color: theme.accent,
              }}
            >
              <Gift className="w-4 h-4" />
              <span>Gửi quà mừng / Chúc phúc</span>
            </button>
          ) : (
            <div
              className="p-6 rounded-3xl border text-center space-y-3"
              style={{
                backgroundColor: theme.cardBg,
                borderColor: `${theme.accent}30`,
              }}
            >
              <span className="text-xs uppercase font-bold tracking-wider" style={{ color: theme.accent }}>
                Thông Tin Quà Mừng
              </span>
              <p className="text-xs opacity-80" style={{ color: theme.foreground }}>
                Sự hiện diện của bạn là món quà quý giá nhất. Nếu bạn muốn gửi thêm lời chúc mừng:
              </p>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-1">
                <p className="font-bold text-slate-800">{giftTransferInfo.bankName}</p>
                <p className="text-sm font-bold text-rose-600">{giftTransferInfo.accountNumber}</p>
                <p className="text-slate-600">{giftTransferInfo.accountHolder}</p>
              </div>

              <button
                onClick={copyAccount}
                className="py-1.5 px-4 rounded-full text-xs font-semibold bg-slate-800 text-white hover:bg-slate-900 transition-colors inline-flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                <span>{copied ? "Đã sao chép số TK!" : "Sao chép số tài khoản"}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Thank you note */}
      <div className="space-y-1">
        <p className="text-sm font-serif italic" style={{ color: theme.muted }}>
          Chân thành cảm ơn bạn đã là một phần đặc biệt trong ngày vui của chúng mình!
        </p>
        <Heart className="w-4 h-4 mx-auto text-rose-400 fill-current opacity-70" />
      </div>

      {/* Report & Platform Branding */}
      <div className="pt-6 border-t border-slate-200/50 flex flex-col items-center gap-2 text-[11px] opacity-60">
        <Link
          href={`/report/${slug || "unknown"}`}
          className="hover:underline flex items-center gap-1 text-slate-500 hover:text-slate-800"
        >
          <AlertTriangle className="w-3 h-3" />
          <span>Báo cáo nội dung lạm dụng / vi phạm</span>
        </Link>
        <Link href="/" className="hover:underline text-slate-500 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-rose-500" />
          <span>Tạo thiệp tương tác miễn phí với Ding Dong Gift</span>
        </Link>
      </div>
    </div>
  );
}

