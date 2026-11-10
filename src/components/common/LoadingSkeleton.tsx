"use client";

interface LoadingSkeletonProps {
  count?: number;
}

export default function LoadingSkeleton({ count = 6 }: LoadingSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[960px] mx-auto w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-[16px] border border-[#eee] p-0 overflow-hidden shadow-xs animate-pulse"
        >
          <div className="aspect-[16/10] bg-slate-200 w-full" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-slate-200 rounded-md w-3/4" />
            <div className="h-3 bg-slate-100 rounded-md w-1/2 ml-auto" />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="h-8 bg-slate-200 rounded-md" />
              <div className="h-8 bg-slate-100 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

