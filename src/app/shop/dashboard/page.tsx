"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  Package,
  Inbox,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  MapPin,
  Loader2,
  DollarSign,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export default function ShopDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Product Form state
  const [productTitle, setProductTitle] = useState("");
  const [productCategory, setProductCategory] = useState("Hoa tươi");
  const [productMinPrice, setProductMinPrice] = useState("");
  const [productMaxPrice, setProductMaxPrice] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Quote input modal/state
  const [activeQuotingId, setActiveQuotingId] = useState<string | null>(null);
  const [quoteAmount, setQuoteAmount] = useState("");

  const loadRequests = async () => {
    try {
      const res = await fetch("/api/v1/shop/requests");
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          router.push("/auth/sign-in?redirect=/shop/dashboard");
          return;
        }
        throw new Error("Không thể tải yêu cầu của cửa hàng.");
      }
      const data = await res.json();
      setRequests(data.data.requests);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleUpdateStatus = async (
    requestId: string,
    status: string,
    quotedAmountVnd?: number
  ) => {
    setActionLoading(`${requestId}-${status}`);
    try {
      const res = await fetch(`/api/v1/shop/requests/${requestId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          quotedAmountVnd: quotedAmountVnd !== undefined ? quotedAmountVnd : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Cập nhật trạng thái thất bại.");
      }

      setToastMessage(data.data.message);
      setActiveQuotingId(null);
      setQuoteAmount("");
      await loadRequests();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productTitle.trim()) return;

    setIsSubmittingProduct(true);
    try {
      const res = await fetch("/api/v1/shop/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: productTitle.trim(),
          category: productCategory,
          minPriceVnd: productMinPrice ? parseInt(productMinPrice, 10) : undefined,
          maxPriceVnd: productMaxPrice ? parseInt(productMaxPrice, 10) : undefined,
          description: productDesc.trim() || undefined,
          qrCompatible: true,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Thêm sản phẩm thất bại.");
      }

      setToastMessage("Đã thêm sản phẩm thành công!");
      setProductTitle("");
      setProductMinPrice("");
      setProductMaxPrice("");
      setProductDesc("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-1">
              <Link href="/dashboard" className="hover:underline">Dashboard</Link>
              <span>/</span>
              <span>Quản lý Cửa hàng</span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
              <Store className="w-6 h-6 text-rose-600" />
              Bảng Điều Khiển Cửa Hàng Đối Tác
            </h1>
          </div>

          <Link
            href="/shops"
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-semibold rounded-xl bg-white hover:bg-neutral-50 transition"
          >
            <span>Xem trang danh bạ</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {toastMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Đóng
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Quote Requests */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
                <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-rose-600" />
                  Yêu Cầu Báo Giá & Đặt Hàng ({requests.length})
                </h2>
              </div>

              {loading ? (
                <div className="p-12 text-center text-neutral-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Đang tải danh sách yêu cầu...</span>
                </div>
              ) : requests.length === 0 ? (
                <div className="p-12 text-center text-neutral-500">
                  Chưa có yêu cầu báo giá nào gửi tới cửa hàng của bạn.
                </div>
              ) : (
                <div className="divide-y divide-neutral-200">
                  {requests.map((req) => (
                    <div key={req.id} className="p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-mono text-xs font-semibold text-neutral-400">#{req.id.substring(0, 8)}</span>
                          <h3 className="font-bold text-base text-neutral-900">
                            {req.product ? req.product.title : "Yêu cầu báo giá chung"} (SL: {req.requestedQty})
                          </h3>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold self-start sm:self-center ${
                            req.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-800"
                              : req.status === "ACCEPTED"
                              ? "bg-blue-100 text-blue-800"
                              : req.status === "QUOTED"
                              ? "bg-purple-100 text-purple-800"
                              : req.status === "DECLINED"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      {/* Customer & Delivery details */}
                      <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 text-xs space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-700">
                          <div>
                            <span className="text-neutral-400">Người nhận: </span>
                            <span className="font-semibold">{req.recipientName || "Khách hàng"}</span>
                          </div>
                          <div>
                            <span className="text-neutral-400">Số điện thoại: </span>
                            <span className="font-mono font-semibold">{req.recipientPhone}</span>
                          </div>
                        </div>
                        {req.deliveryAddress && (
                          <div className="text-neutral-700">
                            <span className="text-neutral-400">Địa chỉ giao: </span>
                            <span>{req.deliveryAddress}, {req.deliveryCity}</span>
                          </div>
                        )}
                        {req.note && (
                          <div className="text-neutral-700 pt-1 border-t border-neutral-200">
                            <span className="text-neutral-400">Lời nhắn / ghi chú: </span>
                            <span className="italic">&quot;{req.note}&quot;</span>
                          </div>
                        )}
                        {req.invitation && (
                          <div className="text-neutral-700 pt-1 border-t border-neutral-200 flex items-center gap-1">
                            <span className="text-neutral-400">Thiệp đính kèm: </span>
                            <Link
                              href={`/i/${req.invitation.slug}`}
                              target="_blank"
                              className="text-rose-600 hover:underline font-semibold"
                            >
                              {req.invitation.title}
                            </Link>
                          </div>
                        )}
                        {req.finalQuotedVnd && (
                          <div className="text-emerald-700 font-bold pt-1 border-t border-neutral-200">
                            Giá đã báo: {req.finalQuotedVnd.toLocaleString("vi-VN")} VND
                          </div>
                        )}
                      </div>

                      {/* Status Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {req.status === "SUBMITTED" && (
                          <>
                            {activeQuotingId === req.id ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  placeholder="Nhập giá VND..."
                                  value={quoteAmount}
                                  onChange={(e) => setQuoteAmount(e.target.value)}
                                  className="px-3 py-1.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                                />
                                <button
                                  onClick={() => handleUpdateStatus(req.id, "QUOTED", parseInt(quoteAmount, 10) || 0)}
                                  disabled={actionLoading !== null}
                                  className="px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition"
                                >
                                  Gửi Báo Giá
                                </button>
                                <button
                                  onClick={() => setActiveQuotingId(null)}
                                  className="px-2 py-1.5 text-neutral-500 text-xs hover:underline"
                                >
                                  Hủy
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setActiveQuotingId(req.id)}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg transition"
                              >
                                Báo Giá Khách
                              </button>
                            )}

                            <button
                              onClick={() => handleUpdateStatus(req.id, "ACCEPTED")}
                              disabled={actionLoading !== null}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
                            >
                              Nhận Đơn Trực Tiếp
                            </button>

                            <button
                              onClick={() => handleUpdateStatus(req.id, "DECLINED")}
                              disabled={actionLoading !== null}
                              className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-lg transition"
                            >
                              Từ Chối
                            </button>
                          </>
                        )}

                        {req.status === "QUOTED" && (
                          <button
                            onClick={() => handleUpdateStatus(req.id, "ACCEPTED")}
                            disabled={actionLoading !== null}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
                          >
                            Khách Đồng Ý → Bắt Đầu Làm
                          </button>
                        )}

                        {req.status === "ACCEPTED" && (
                          <button
                            onClick={() => handleUpdateStatus(req.id, "COMPLETED")}
                            disabled={actionLoading !== null}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
                          >
                            Đã Giao Xong → Hoàn Tất
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Side Column: Add Product Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
              <h2 className="text-base font-bold text-neutral-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-rose-600" />
                Thêm Sản Phẩm Mới
              </h2>

              <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-neutral-700 uppercase mb-1">
                    Tên sản phẩm *
                  </label>
                  <input
                    type="text"
                    required
                    value={productTitle}
                    onChange={(e) => setProductTitle(e.target.value)}
                    placeholder="VD: Bó hoa hướng dương rực rỡ"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 uppercase mb-1">
                    Danh mục
                  </label>
                  <select
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                  >
                    <option value="Hoa tươi">Hoa tươi</option>
                    <option value="Hoa sáp">Hoa sáp</option>
                    <option value="Quà tốt nghiệp">Quà tốt nghiệp</option>
                    <option value="Gấu bông">Gấu bông</option>
                    <option value="Hộp quà & Chocolate">Hộp quà & Chocolate</option>
                    <option value="Thiệp giấy & Gift Tag">Thiệp giấy & Gift Tag</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-neutral-700 uppercase mb-1">
                      Giá từ (VND)
                    </label>
                    <input
                      type="number"
                      value={productMinPrice}
                      onChange={(e) => setProductMinPrice(e.target.value)}
                      placeholder="250000"
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-neutral-700 uppercase mb-1">
                      Giá đến (VND)
                    </label>
                    <input
                      type="number"
                      value={productMaxPrice}
                      onChange={(e) => setProductMaxPrice(e.target.value)}
                      placeholder="500000"
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 uppercase mb-1">
                    Mô tả sản phẩm
                  </label>
                  <textarea
                    rows={3}
                    value={productDesc}
                    onChange={(e) => setProductDesc(e.target.value)}
                    placeholder="Bao gồm hoa hướng dương tươi, giấy gói phong cách Hàn Quốc, tương thích đính kèm Thẻ QR Ding Dong Gift..."
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl shadow transition flex items-center justify-center gap-1.5 disabled:opacity-50 text-sm"
                >
                  {isSubmittingProduct ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Lưu Sản Phẩm Mới</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

