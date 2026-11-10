"use client";

import { X, Heart, ExternalLink, Sparkles } from "lucide-react";

interface FollowPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  channelUrl?: string;
}

export default function FollowPromptModal({
  isOpen,
  onClose,
  channelUrl = "https://www.tiktok.com",
}: FollowPromptModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100">
        {/* Cute Avatar Badge */}
        <div className="relative w-20 h-20 mx-auto">
          <div className="w-full h-full rounded-3xl bg-gradient-to-tr from-rose-500 to-amber-400 p-1 shadow-lg shadow-rose-200">
            <div className="w-full h-full rounded-[22px] bg-white flex items-center justify-center text-3xl">
              🐱
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs shadow-md">
            ❤️
          </div>
        </div>

        <div>
          <h3 className="text-base font-bold text-slate-900 font-serif">
            Ảnh QR đã tải về máy! 🎉
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Theo dõi kênh TikTok của Ding Dong Gift để cập nhật thêm nhiều mẫu thiệp tương tác siêu xinh nha!
          </p>
        </div>

        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs font-mono text-slate-700 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-rose-500" />
          <span>@dingdonggift.vn</span>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
          >
            Để sau
          </button>
          <a
            href={channelUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-rose-200 transition flex items-center justify-center gap-1"
          >
            <span>Theo dõi</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

