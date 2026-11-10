"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  Users,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export default function AffiliateDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  // Payout request form
  const [payoutAmount, setPayoutAmount] = useState<number>(100000);
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  const loadDashboard = async () => {
    try {
      const res = await fetch("/api/v1/affiliate/dashboard");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/auth/sign-in?callbackUrl=/affiliate/dashboard");
          return;
        }
        throw new Error("Không thể tải thông tin CTV.");
      }
      const json = await res.json();
      setData(json.data.dashboard);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleCopyLink = () => {
    if (data?.referralUrl) {
      navigator.clipboard.writeText(data.referralUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPayout(true);
    setPayoutMessage(null);
    setPayoutError(null);

    try {
      const res = await fetch("/api/v1/affiliate/payout-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountVnd: Number(payoutAmount) }),
      });

      const resJson = await res.json();
      if (!res.ok) {
        throw new Error(resJson.error?.message || "Yêu cầu rút tiền không thành công.");
      }

      setPayoutMessage(resJson.data.message);
      loadDashboard();
    } catch (err: any) {
      setPayoutError(err.message || "Đã có lỗi xảy ra.");
    } finally {
      setSubmittingPayout(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!data || data.status === "NOT_APPLIED") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl mb-4">
          <DollarSign className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">
          Bạn chưa đăng ký làm Cộng tác viên
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mb-6">
          Tham gia mạng lưới đối tác Ding Dong Gift ngay hôm nay để nhận 10% hoa hồng trên mọi đơn hàng kỹ thuật số.
        </p>
        <Link
          href="/affiliate/apply"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-full shadow-lg shadow-indigo-100 transition"
        >
          Đăng ký tham gia ngay
        </Link>
      </div>
    );
  }

  if (data.status === "APPLIED") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
        <div className="p-4 bg-amber-50 text-amber-600 rounded-3xl mb-4">
          <Clock className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">
          Hồ sơ của bạn đang được xét duyệt
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md">
          Ban quản trị đang kiểm tra thông tin tài khoản thụ hưởng. Bạn sẽ nhận được thông báo ngay khi hồ sơ được kích hoạt.
        </p>
      </div>
    );
  }

  const { stats, commissions, payoutRequests } = data;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đối tác CTV chính thức (10%)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900">
              Bảng điều khiển Đối tác Affiliate
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Mã CTV: <code className="font-mono font-bold text-slate-800">{data.referralCode}</code>
            </p>
          </div>

          {/* Referral Link Box */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 max-w-md w-full space-y-2">
            <div className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Đường dẫn giới thiệu của bạn
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={data.referralUrl || ""}
                data-testid="affiliate-referral-link-input"
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 font-mono focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                data-testid="copy-affiliate-link-btn"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition flex items-center gap-1 shadow-sm"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Đã chép" : "Sao chép"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
            <div className="text-xs text-slate-500 font-medium">Lượt click hợp lệ</div>
            <div className="text-2xl font-bold text-slate-900" data-testid="stat-total-clicks">
              {stats.totalClicks}
            </div>
            <div className="text-[11px] text-slate-400">Từ link giới thiệu của bạn</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
            <div className="text-xs text-slate-500 font-medium">Đơn chuyển đổi thành công</div>
            <div className="text-2xl font-bold text-slate-900" data-testid="stat-total-conversions">
              {stats.totalConversions}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium">
              Doanh thu: {stats.totalEligibleRevenue.toLocaleString("vi-VN")} đ
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1">
            <div className="text-xs text-slate-500 font-medium">Hoa hồng chờ (Hold 14 ngày)</div>
            <div className="text-2xl font-bold text-amber-600" data-testid="stat-pending-balance">
              {stats.pendingBalance.toLocaleString("vi-VN")} đ
            </div>
            <div className="text-[11px] text-slate-400">Đang trong thời gian giữ bảo đảm</div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm space-y-1 ring-2 ring-emerald-500/20">
            <div className="text-xs text-emerald-700 font-semibold">Hoa hồng khả dụng rút</div>
            <div className="text-2xl font-bold text-emerald-600" data-testid="stat-available-balance">
              {stats.availableBalance.toLocaleString("vi-VN")} đ
            </div>
            <div className="text-[11px] text-slate-400">
              Đã rút: {stats.paidBalance.toLocaleString("vi-VN")} đ
            </div>
          </div>
        </div>

        {/* Payout Request Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Yêu cầu rút hoa hồng</h2>
              <p className="text-xs text-slate-500">
                Tài khoản thụ hưởng: {data.payoutBankCode} • {data.payoutAccountMasked}
              </p>
            </div>
            <div className="text-xs text-slate-400">Tối thiểu: 100.000 đ</div>
          </div>

          {payoutError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{payoutError}</span>
            </div>
          )}

          {payoutMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{payoutMessage}</span>
            </div>
          )}

          <form onSubmit={handleRequestPayout} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <input
                type="number"
                min="100000"
                step="10000"
                required
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(Number(e.target.value))}
                placeholder="Nhập số tiền cần rút (VND)"
                data-testid="payout-amount-input"
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="absolute right-4 top-2.5 text-xs text-slate-400 font-semibold">
                VND
              </span>
            </div>

            <button
              type="submit"
              disabled={submittingPayout || stats.availableBalance < 100000}
              data-testid="submit-payout-request-btn"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
            >
              {submittingPayout ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang gửi yêu cầu...
                </>
              ) : (
                <>
                  <DollarSign className="w-3.5 h-3.5" /> Gửi yêu cầu rút tiền
                </>
              )}
            </button>
          </form>
        </div>

        {/* Commissions History */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-3 p-6">
          <h2 className="text-base font-bold text-slate-900">
            Lịch sử hoa hồng đơn hàng
          </h2>
          <p className="text-xs text-slate-500">
            Tuân thủ chính sách bảo mật quyền riêng tư: danh tính và nội dung thiệp của khách hàng được ẩn danh hoàn toàn.
          </p>

          {commissions.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Chưa có giao dịch hoa hồng nào được ghi nhận.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Mã đơn</th>
                    <th className="py-2.5 px-3">Doanh thu số hợp lệ</th>
                    <th className="py-2.5 px-3">Hoa hồng (10%)</th>
                    <th className="py-2.5 px-3">Trạng thái</th>
                    <th className="py-2.5 px-3">Ngày mở khóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {commissions.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-3 font-mono font-medium text-slate-800">
                        {c.orderCodeMasked}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {c.eligibleBaseVnd.toLocaleString("vi-VN")} đ
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-emerald-600">
                        +{c.amountVnd.toLocaleString("vi-VN")} đ
                      </td>
                      <td className="py-3 px-3">
                        {c.status === "REVERSED" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            ĐÃ ĐẢO SỔ (REFUND)
                          </span>
                        ) : c.status === "PENDING" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                            ĐANG GIỮ (HOLD)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                            KHẢ DỤNG
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(c.holdUntil).toLocaleDateString("vi-VN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payout Requests History */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-3 p-6">
          <h2 className="text-base font-bold text-slate-900">
            Lịch sử yêu cầu rút tiền
          </h2>
          <p className="text-xs text-slate-500">
            Theo dõi tiến độ đối soát và mã giao dịch ngân hàng chuyển tiền của ban quản trị.
          </p>

          {payoutRequests.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Chưa có yêu cầu rút tiền nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Mã yêu cầu</th>
                    <th className="py-2.5 px-3">Số tiền</th>
                    <th className="py-2.5 px-3">Trạng thái</th>
                    <th className="py-2.5 px-3">Mã đối soát ngân hàng</th>
                    <th className="py-2.5 px-3">Ngày yêu cầu</th>
                    <th className="py-2.5 px-3">Ngày chi trả</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payoutRequests.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-3 font-mono font-medium text-slate-800">
                        REQ-{p.id.slice(-6).toUpperCase()}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {p.amountVnd.toLocaleString("vi-VN")} đ
                      </td>
                      <td className="py-3 px-3">
                        {p.status === "PAID" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ĐÃ THANH TOÁN
                          </span>
                        ) : p.status === "REJECTED" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                            TỪ CHỐI
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                            ĐANG XỬ LÝ
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-700">
                        {p.externalReference || "—"}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(p.requestAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString("vi-VN") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

