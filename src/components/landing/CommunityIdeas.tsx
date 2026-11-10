"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Lightbulb, Lock, ThumbsUp, LogIn, Sparkles, MessageSquare } from "lucide-react";
import { communityIdeasSample } from "@/data/landingData";

export default function CommunityIdeas() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/v1/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setIsAuthenticated(Boolean(data?.data?.user));
      })
      .catch(() => setIsAuthenticated(false));
  }, []);

  return (
    <section className="py-12 lg:py-16 bg-white">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
        <div className="relative rounded-[24px] bg-[#fff3f4] border border-rose-200/80 p-6 sm:p-10 lg:p-12 text-center shadow-[0_4px_20px_rgba(250,65,106,0.06)] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 text-[#ff6b61]" />
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#ff6b61] to-[#fa416a] bg-clip-text text-transparent">
              Ý tưởng từ cộng đồng
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#73737d] max-w-md mx-auto mb-8">
            Cùng cộng đồng xây dựng Ding Dong Gift đẹp hơn và nhiều tiện ích hơn mỗi ngày.
          </p>

          {/* Logged In View */}
          {isAuthenticated === true ? (
            <div className="space-y-4 text-left max-w-2xl mx-auto">
              {communityIdeasSample.map((idea) => (
                <div
                  key={idea.id}
                  className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-rose-100 flex items-center justify-between gap-4 transition-all hover:shadow-md"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-[#fa416a] text-[10px] font-semibold">
                        {idea.category}
                      </span>
                      <span className="text-[11px] text-slate-400">{idea.createdAt}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 truncate">{idea.title}</h3>
                    <p className="text-[11px] text-slate-400">Đóng góp bởi: {idea.author}</p>
                  </div>

                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#fa416a] text-xs font-semibold shrink-0 transition-colors cursor-pointer"
                    title="Bình chọn ý tưởng này"
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{idea.votes}</span>
                  </button>
                </div>
              ))}

              <div className="pt-4 text-center">
                <Link
                  href="/create"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#ff6b61] to-[#fa416a] text-white text-xs font-semibold shadow-xs hover:opacity-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Đóng góp ý tưởng mới</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Logged Out View with Auth Gate Overlay */
            <div className="relative max-w-2xl mx-auto">
              {/* Blurred Background Skeletons (Decorative only, no private data leaked) */}
              <div className="space-y-3 filter blur-[5px] select-none opacity-60 pointer-events-none" aria-hidden="true">
                <div className="bg-white rounded-xl p-4 shadow-xs border border-rose-100 flex items-center justify-between">
                  <div className="space-y-2 w-3/4">
                    <div className="h-3 bg-rose-200/60 rounded w-1/4" />
                    <div className="h-4 bg-slate-300/60 rounded w-5/6" />
                  </div>
                  <div className="h-8 w-16 bg-rose-100 rounded-lg" />
                </div>
                <div className="bg-white rounded-xl p-4 shadow-xs border border-rose-100 flex items-center justify-between">
                  <div className="space-y-2 w-3/4">
                    <div className="h-3 bg-rose-200/60 rounded w-1/3" />
                    <div className="h-4 bg-slate-300/60 rounded w-4/6" />
                  </div>
                  <div className="h-8 w-16 bg-rose-100 rounded-lg" />
                </div>
                <div className="bg-white rounded-xl p-4 shadow-xs border border-rose-100 flex items-center justify-between">
                  <div className="space-y-2 w-3/4">
                    <div className="h-3 bg-rose-200/60 rounded w-1/4" />
                    <div className="h-4 bg-slate-300/60 rounded w-3/4" />
                  </div>
                  <div className="h-8 w-16 bg-rose-100 rounded-lg" />
                </div>
              </div>

              {/* Centered Lock Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ff6b61] to-[#fa416a] flex items-center justify-center text-white shadow-lg shadow-rose-200 mb-3 animate-pulse">
                  <Lock className="w-6 h-6 stroke-[2.2]" />
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
                  Đăng nhập để xem ý tưởng cộng đồng
                </h3>

                <p className="text-xs sm:text-[13px] text-slate-600 max-w-sm mb-4 leading-relaxed">
                  Khám phá những ý tưởng thiết kế độc đáo và bình chọn tính năng mới bạn mong muốn có trên Ding Dong Gift.
                </p>

                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#ff6b61] to-[#fa416a] hover:opacity-95 text-white text-xs sm:text-sm font-semibold rounded-full shadow-md shadow-rose-200 transition-all hover:scale-105 active:scale-95"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập ngay</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

