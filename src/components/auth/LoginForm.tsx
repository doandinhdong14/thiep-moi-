"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, Info } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || searchParams.get("callbackUrl") || "/dashboard";

  // Validate returnTo to avoid open redirect vulnerabilities
  const safeReturnTo = returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    const err = searchParams.get("error");
    if (!err) return null;
    if (err === "oauth_not_configured") return "Hệ thống Google OAuth chưa được cấu hình Client ID.";
    if (err === "account_suspended") return "Tài khoản của bạn đã bị khóa hoặc tạm dừng hoạt động.";
    if (err === "access_denied") return "Bạn đã hủy cấp quyền đăng nhập Google.";
    return "Đăng nhập bằng Google không thành công. Vui lòng thử lại.";
  });
  const [oauthNotice, setOauthNotice] = useState<string | null>(null);

  const handleGoogleSignIn = () => {
    setErrorMessage(null);
    setOauthNotice(null);
    setGoogleLoading(true);
    window.location.href = `/api/v1/auth/google?returnTo=${encodeURIComponent(safeReturnTo)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setOauthNotice(null);

    if (!email.trim() || !password) {
      setErrorMessage("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          rememberMe,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || "Email hoặc mật khẩu không chính xác.");
      }

      // Notify Navbar and other listeners that auth state has changed
      window.dispatchEvent(new Event("auth-change"));

      // Redirect to safe returnTo
      window.location.href = safeReturnTo;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full md:w-1/2 p-6 sm:p-10 flex flex-col justify-center bg-white">
      <div className="mb-4 md:hidden">
        <BrandLogo size="sm" theme="light" />
      </div>

      {/* Heading & Subtitle */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-[24px] font-bold text-slate-900 tracking-tight">
          Chào mừng trở lại
        </h1>
        <p className="text-xs sm:text-[13px] text-slate-500 mt-1">
          Đăng nhập để tiếp tục tạo và quản lý món quà của bạn.
        </p>
      </div>

      {/* OAuth Notice Alert */}
      {oauthNotice && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-800 text-xs leading-relaxed animate-fadeIn">
          <Info className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <span>{oauthNotice}</span>
        </div>
      )}

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-700 text-xs leading-relaxed animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Google Sign-In Button */}
      <button
        type="button"
        disabled={googleLoading}
        onClick={handleGoogleSignIn}
        className="w-full h-[44px] flex items-center justify-center gap-2.5 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-[10px] transition-colors shadow-2xs disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {googleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
        ) : (
          /* Authentic Google "G" SVG */
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
        )}
        <span>{googleLoading ? "Đang chuyển đến Google..." : "Tiếp tục với Google"}</span>
      </button>

      {/* Divider */}
      <div className="flex items-center my-4">
        <div className="flex-1 border-t border-slate-200" />
        <span className="px-3 text-[11px] uppercase tracking-wider text-slate-400 font-medium">
          hoặc dùng email
        </span>
        <div className="flex-1 border-t border-slate-200" />
      </div>

      {/* Email + Password Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Email Input */}
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full h-[46px] pl-10 pr-3.5 rounded-[12px] border border-slate-200 focus:border-[#fa416a] focus:ring-2 focus:ring-rose-100 text-xs sm:text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Password Input */}
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mật khẩu"
            className="w-full h-[46px] pl-10 pr-10 rounded-[12px] border border-slate-200 focus:border-[#fa416a] focus:ring-2 focus:ring-rose-100 text-xs sm:text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Remember Me Checkbox */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded text-[#fa416a] accent-[#fa416a] focus:ring-[#fa416a]"
            />
            <span className="text-[13px] text-slate-600">Ghi nhớ đăng nhập</span>
          </label>
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-[46px] rounded-[12px] bg-gradient-to-r from-[#fa416a] to-[#e93459] hover:opacity-95 disabled:opacity-50 text-white text-sm font-semibold shadow-md shadow-rose-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang đăng nhập...</span>
            </>
          ) : (
            <span>Đăng nhập</span>
          )}
        </button>
      </form>

      {/* Link to Register */}
      <div className="text-center text-xs text-slate-500 mt-5">
        Chưa có tài khoản?{" "}
        <Link
          href="/auth/sign-up"
          className="text-[#fa416a] font-semibold underline decoration-[#fa416a]/50 hover:decoration-[#fa416a] transition-all"
        >
          Đăng ký miễn phí
        </Link>
      </div>
    </div>
  );
}

