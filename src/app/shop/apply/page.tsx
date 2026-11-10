"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store, Sparkles, CheckCircle2, AlertCircle, ArrowLeft, Send } from "lucide-react";

export default function ShopApplyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    city: "Hà Nội",
    address: "",
    phone: "",
    contactEmail: "",
    description: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/shop/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok || !data.data) {
        if (res.status === 401) {
          router.push("/auth/sign-in?redirect=/shop/apply");
          return;
        }
        throw new Error(data.error?.message || "Đăng ký đối tác thất bại.");
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-neutral-200 p-8 text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Đăng ký thành công!</h1>
          <p className="text-neutral-600 text-sm mb-6 leading-relaxed">
            Hồ sơ đối tác cửa hàng của bạn đã được gửi tới đội ngũ Ding Dong Gift. Chúng tôi sẽ duyệt thông tin và cấp quyền Shop Owner trong vòng 24 giờ.
          </p>
          <Link
            href="/dashboard"
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-neutral-900 text-white font-medium rounded-xl hover:bg-neutral-800 transition"
          >
            Về trang quản lý
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50/40 via-white to-neutral-50 py-12 px-4 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-neutral-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900">Đăng ký Đối tác Cửa hàng</h1>
              <p className="text-xs text-neutral-500">Tham gia mạng lưới Hoa & Quà tặng Ding Dong Gift</p>
            </div>
          </div>
          <Link href="/" className="text-neutral-400 hover:text-neutral-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
              Tên Cửa Hàng / Thương Hiệu *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Tiệm Hoa Tháng Tư"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                Tỉnh / Thành Phố *
              </label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="Hà Nội">Hà Nội</option>
                <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                <option value="Đà Nẵng">Đà Nẵng</option>
                <option value="Hải Phòng">Hải Phòng</option>
                <option value="Cần Thơ">Cần Thơ</option>
                <option value="Khác">Tỉnh thành khác</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
                Số Điện Thoại Liên Hệ *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0912345678"
                className="w-full px-4 py-2.5 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
              Địa Chỉ Cửa Hàng / Kho Giao Hàng
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="VD: 123 Phố Huế, Hai Bà Trưng"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
              Email Liên Hệ / Tiếp Nhận Đơn
            </label>
            <input
              type="email"
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              placeholder="contact@tiemhoa.com"
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 uppercase mb-1">
              Giới Thiệu Ngắn Về Cửa Hàng & Sản Phẩm
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Chuyên hoa tươi thiết kế, hoa cưới, gấu bông và hộp quà đính kèm thiệp thông minh..."
              className="w-full px-4 py-2.5 text-sm rounded-xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-6 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Gửi Hồ Sơ Đăng Ký</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

