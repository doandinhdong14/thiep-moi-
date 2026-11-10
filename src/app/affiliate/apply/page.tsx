"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  CreditCard,
  ArrowRight,
  Loader2,
  DollarSign,
} from "lucide-react";

export default function AffiliateApplyPage() {
  const router = useRouter();
  const [bankCode, setBankCode] = useState("VCB");
  const [accountNumber, setAccountNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(true);
  const [profileStatus, setProfileStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/affiliate/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.dashboard?.status) {
          setProfileStatus(data.data.dashboard.status);
          if (data.data.dashboard.status === "APPROVED") {
            router.push("/affiliate/dashboard");
          }
        }
      })
      .catch(() => {})
      .finally(() => setCheckLoading(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/v1/affiliate/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutBankCode: bankCode,
          payoutAccount: accountNumber.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/sign-in?callbackUrl=/affiliate/apply");
          return;
        }
        throw new Error(data.error?.message || "Đăng ký không thành công.");
      }

      setMessage(data.data.message);
      setProfileStatus(data.data.affiliate.status);
    } catch (err: any) {
      setError(err.message || "Đã có lỗi xảy ra.");
    } finally {
      setLoading(false);
    }
  };

  if (checkLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Header banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-50 text-indigo-600 mb-1">
            <DollarSign className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900">
            Chương trình Cộng tác viên (CTV) 10%
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Nhận 10% hoa hồng trên mọi đơn hàng sản phẩm số khi người dùng đăng ký hoặc nâng cấp thiệp qua liên kết của bạn.
          </p>
        </div>

        {profileStatus === "APPLIED" ? (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900">
              Đơn đăng ký của bạn đang được xét duyệt!
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Hệ thống và ban quản trị sẽ xem xét hồ sơ và kích hoạt link giới thiệu cho bạn sớm nhất.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5"
          >
            <h2 className="text-base font-bold text-slate-800">
              Thông tin nhận thanh toán hoa hồng
            </h2>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {message && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{message}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ngân hàng thụ hưởng
              </label>
              <select
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                data-testid="affiliate-bank-select"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="VCB">Vietcombank (Ngoại thương Việt Nam)</option>
                <option value="TCB">Techcombank (Kỹ Thương)</option>
                <option value="MB">MB Bank (Quân Đội)</option>
                <option value="ACB">ACB (Á Châu)</option>
                <option value="VPB">VPBank (Việt Nam Thịnh Vượng)</option>
                <option value="BIDV">BIDV (Đầu tư và Phát triển)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Số tài khoản ngân hàng
              </label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Ví dụ: 19038294719283"
                data-testid="affiliate-account-input"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                data-testid="submit-affiliate-apply-btn"
                className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm rounded-2xl shadow-lg shadow-indigo-100 transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang gửi đơn đăng ký...
                  </>
                ) : (
                  <>
                    <span>Gửi đơn đăng ký CTV</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Bằng việc đăng ký, bạn đồng ý với Điều khoản đối tác và chính sách hoa hồng 10% của Ding Dong Gift.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

