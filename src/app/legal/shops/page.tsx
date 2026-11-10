import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ShopPolicyPage() {
  return (
    <div className="flex-1 bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <Link
          href="/"
          className="text-xs font-semibold text-rose-600 hover:underline inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại trang chủ</span>
        </Link>

        <div className="space-y-4">
          <h1 className="text-3xl font-serif font-bold text-slate-900">
            Chính Sách Đối Tác Cửa Hàng Hoa & Quà Tặng
          </h1>
          <p className="text-xs text-slate-500">Phiên bản 1.0 — Cập nhật ngày 04/11/2026 (Chờ rà soát pháp lý)</p>
        </div>

        <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-6 text-slate-700">
          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-slate-900">1. Bản chất dịch vụ trong giai đoạn P0</h2>
            <p>
              Ding Dong Gift hoạt động như kênh kết nối và khám phá đối tác (Partner Discovery & Quote Request). Nền tảng không giữ tiền thanh toán hàng vật lý. Cửa hàng và người mua tự thỏa thuận xác nhận báo giá, phương thức giao nhận và thanh toán trực tiếp.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-slate-900">2. Trách nhiệm của cửa hàng</h2>
            <p>
              Cửa hàng chịu trách nhiệm về tính trung thực của hình ảnh sản phẩm, đảm bảo chất lượng hoa/quà đúng cam kết và giao hàng đúng thời gian người mua yêu cầu. Cửa hàng phải bảo mật tuyệt đối thông tin liên hệ và địa chỉ của người nhận hàng.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

