"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, AlertCircle } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignUp = () => {
    setError(null);
    setGoogleLoading(true);
    window.location.href = "/api/v1/auth/google?returnTo=/dashboard";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/sign-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || "Đăng ký không thành công.");
      }

      // Redirect to dashboard on success
      window.dispatchEvent(new Event("auth-change"));
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Đã xảy ra lỗi vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-xl shadow-rose-100/50 border border-rose-100">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-rose-200">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="mt-4 text-2xl font-serif font-bold text-slate-900">Tạo tài khoản Ding Dong Gift</h2>
          <p className="mt-2 text-sm text-slate-500">
            Bắt đầu tạo thiệp mời và lưu giữ khoảnh khắc trong 2 phút
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-Up Button */}
        <button
          type="button"
          disabled={googleLoading}
          onClick={handleGoogleSignUp}
          className="w-full h-[44px] flex items-center justify-center gap-2.5 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-colors shadow-2xs disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
          ) : (
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
            hoặc đăng ký bằng email
          </span>
          <div className="flex-1 border-t border-slate-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên của bạn</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ten@vidu.vn"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu (tối thiểu 6 ký tự)</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm transition-all"
            />
          </div>

          <div className="text-xs text-slate-500 leading-relaxed">
            Bằng việc nhấn Đăng ký, bạn đồng ý với{" "}
            <Link href="/legal/terms" className="text-rose-600 underline">
              Điều khoản dịch vụ
            </Link>{" "}
            và{" "}
            <Link href="/legal/privacy" className="text-rose-600 underline">
              Chính sách bảo vệ dữ liệu cá nhân
            </Link>
            .
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-medium rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tạo tài khoản miễn phí"}
          </button>
        </form>

        <div className="text-center text-sm text-slate-500">
          Đã có tài khoản?{" "}
          <Link href="/auth/sign-in" className="text-rose-600 hover:underline font-medium">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
