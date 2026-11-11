"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Shield,
  KeyRound,
  Coins,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Store,
  Share2,
  Sparkles,
  ArrowLeft,
  Mail,
  Calendar,
  Save,
  Lock,
} from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  status: string;
  locale: string;
  imageCredits: number;
  audioCredits: number;
  createdAt: string;
  roles: string[];
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile Form
  const [name, setName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    fetch("/api/v1/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Chưa đăng nhập");
        return res.json();
      })
      .then((data) => {
        if (data?.data?.user) {
          setUser(data.data.user);
          setName(data.data.user.name || "");
        } else {
          router.push("/auth/sign-in?callbackUrl=/dashboard/account");
        }
      })
      .catch(() => {
        router.push("/auth/sign-in?callbackUrl=/dashboard/account");
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast("Họ và tên không được để trống", "error");
      return;
    }

    setSavingProfile(true);
    try {
      const res = await fetch("/api/v1/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Không thể cập nhật hồ sơ");

      setUser((prev) => (prev ? { ...prev, name: data.data.user.name } : null));
      window.dispatchEvent(new Event("auth-change"));
      showToast("Cập nhật thông tin hồ sơ thành công!");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      showToast("Vui lòng nhập mật khẩu hiện tại", "error");
      return;
    }
    if (newPassword.length < 6) {
      showToast("Mật khẩu mới phải có ít nhất 6 ký tự", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("Xác nhận mật khẩu mới không khớp", "error");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch("/api/v1/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Không thể đổi mật khẩu");

      showToast("Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-rose-500 font-medium text-sm">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Đang tải thông tin tài khoản...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isAdmin = user.roles.includes("ADMIN");
  const isShopPartner = user.roles.includes("SHOP_OWNER") || user.roles.includes("SHOP_STAFF");
  const isAffiliate = user.roles.includes("AFFILIATE");

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-lg border flex items-center gap-2.5 animate-slide-up ${
            toastMessage.type === "success"
              ? "bg-slate-900 text-white border-slate-800"
              : "bg-rose-600 text-white border-rose-500"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-200 shrink-0" />
          )}
          <span className="text-xs font-medium">{toastMessage.text}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Quản lý thiệp mời</span>
          </Link>

          <span className="text-xs font-mono text-slate-400">ID: {user.id}</span>
        </div>

        {/* Page Header Banner */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-bold text-2xl flex items-center justify-center shadow-md">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-serif font-bold text-slate-900">{user.name}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                  {user.status === "ACTIVE" ? "Đang hoạt động" : user.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
                <span className="flex items-center gap-1 font-mono">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {user.email}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Gia nhập: {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
          </div>

          {/* AI Credits Badge */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/70 rounded-2xl p-4 flex items-center gap-4 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
                Số Dư AI Credits
              </p>
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mt-0.5">
                <span>{user.imageCredits} 🖼️ Ảnh</span>
                <span className="text-slate-300">|</span>
                <span>{user.audioCredits} 🎵 Nhạc</span>
              </div>
            </div>
          </div>
        </div>

        {/* Roles & Fast Access Links */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-serif font-bold text-slate-900">
              Vai trò & Cổng dịch vụ được cấp quyền
            </h2>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {user.roles.map((role) => (
              <span
                key={role}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200"
              >
                {role}
              </span>
            ))}
          </div>

          {/* Quick Jump Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center justify-between p-4 rounded-2xl bg-purple-50/60 border border-purple-200 hover:bg-purple-100/60 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-purple-600" />
                  <div>
                    <p className="text-xs font-bold text-purple-900">Trung tâm Quản trị</p>
                    <p className="text-[10px] text-purple-700">Admin Control Portal</p>
                  </div>
                </div>
                <span className="text-purple-600 font-bold group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </Link>
            )}

            {isShopPartner && (
              <Link
                href="/shop/dashboard"
                className="flex items-center justify-between p-4 rounded-2xl bg-rose-50/60 border border-rose-200 hover:bg-rose-100/60 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Store className="w-4 h-4 text-rose-600" />
                  <div>
                    <p className="text-xs font-bold text-rose-900">Kênh Cửa Hàng Shop</p>
                    <p className="text-[10px] text-rose-700">Quản lý hoa & quà tặng</p>
                  </div>
                </div>
                <span className="text-rose-600 font-bold group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </Link>
            )}

            {isAffiliate && (
              <Link
                href="/affiliate"
                className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 hover:bg-emerald-100/60 transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="text-xs font-bold text-emerald-900">Cổng Cộng Tác Viên</p>
                    <p className="text-[10px] text-emerald-700">Hoa hồng CTV 10%</p>
                  </div>
                </div>
                <span className="text-emerald-600 font-bold group-hover:translate-x-1 transition-transform">
                  →
                </span>
              </Link>
            )}
          </div>
        </div>

        {/* Form Grid: Profile & Password */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Edit Profile Form */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-rose-600" />
              <h2 className="text-base font-serif font-bold text-slate-900">Thông tin cá nhân</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Họ và tên hiển thị:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Địa chỉ email đăng nhập:
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-mono cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Email dùng để nhận thông báo đơn hàng và liên kết tài khoản.
                </p>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {savingProfile ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Lưu thông tin</span>
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-serif font-bold text-slate-900">Bảo mật & Đổi mật khẩu</h2>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mật khẩu hiện tại:
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mật khẩu mới (tối thiểu 6 ký tự):
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Xác nhận lại mật khẩu mới:
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-xl shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {savingPassword ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <KeyRound className="w-3.5 h-3.5" />
                )}
                <span>Đổi mật khẩu</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

