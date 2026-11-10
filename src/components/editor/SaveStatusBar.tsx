"use client";

import { Loader2, Save, Undo2, AlertCircle } from "lucide-react";

interface SaveStatusBarProps {
  status: "SAVED" | "UNSAVED" | "SAVING" | "ERROR";
  errorMessage?: string | null;
  onSave: () => void;
  onRevert: () => void;
}

export default function SaveStatusBar({
  status,
  errorMessage,
  onSave,
  onRevert,
}: SaveStatusBarProps) {
  if (status === "SAVED") return null;

  return (
    <div className="sticky top-2 z-30 mx-auto max-w-xl w-full mb-3 px-2 transition-all animate-in fade-in slide-in-from-top-2">
      <div className="bg-slate-900/90 text-white backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700/80 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {status === "SAVING" ? (
            <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
          ) : status === "ERROR" ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          )}

          <span className="font-medium text-slate-200">
            {status === "SAVING"
              ? "Đang tự động lưu..."
              : status === "ERROR"
              ? errorMessage || "Chưa lưu được thay đổi."
              : "Chưa lưu thay đổi"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {status !== "SAVING" && (
            <button
              type="button"
              onClick={onRevert}
              className="px-2.5 py-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1 font-medium text-[11px]"
            >
              <Undo2 className="w-3 h-3" />
              <span>Hủy bỏ</span>
            </button>
          )}

          <button
            type="button"
            onClick={onSave}
            disabled={status === "SAVING"}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-800 text-white font-bold transition flex items-center gap-1.5 text-[11px] shadow-sm"
          >
            {status === "SAVING" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Save className="w-3 h-3" />
            )}
            <span>Lưu ngay</span>
          </button>
        </div>
      </div>
    </div>
  );
}

