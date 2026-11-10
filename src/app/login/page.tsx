"use client";

import { Suspense } from "react";
import AuthPromotionalPanel from "@/components/auth/AuthPromotionalPanel";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex-1 min-h-[calc(100svh-64px)] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-[#fef5f6] via-[#fff5f5] to-[#fcedea]">
      {/* Centered Auth Card: matching Image 2 */}
      <div className="w-full max-w-[880px] min-h-[520px] bg-white rounded-[24px] shadow-2xl shadow-rose-200/40 border border-rose-100/80 overflow-hidden flex flex-col md:flex-row my-auto">
        {/* Left: Promotional Panel */}
        <AuthPromotionalPanel />

        {/* Right: Login Form */}
        <Suspense
          fallback={
            <div className="w-full md:w-1/2 p-10 flex items-center justify-center bg-white">
              <span className="text-xs text-slate-400">Đang tải biểu mẫu...</span>
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

