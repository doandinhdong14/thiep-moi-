"use client";

import { PackageOpen } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title = "Không tìm thấy sản phẩm",
  description = "Hiện chưa có sản phẩm nào thuộc danh mục này. Vui lòng chọn danh mục khác.",
  actionLabel = "Xem tất cả",
  onAction,
}: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4 bg-white rounded-2xl border border-dashed border-slate-200 max-w-lg mx-auto my-8">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 text-[#fa416a] flex items-center justify-center">
        <PackageOpen className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto leading-relaxed">
        {description}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#ff6b61] to-[#fa416a] text-white hover:opacity-95 shadow-sm transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

