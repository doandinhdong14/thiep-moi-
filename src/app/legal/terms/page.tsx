import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfServicePage() {
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
            Điều Khoản Dịch Vụ
          </h1>
          <p className="text-xs text-slate-500">Phiên bản 1.0 — Cập nhật ngày 04/11/2026 (Chờ rà soát pháp lý)</p>
        </div>

        <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-6 text-slate-700">
          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-slate-900">1. Quy định sử dụng nội dung</h2>
            <p>
              Người dùng cam kết sở hữu quyền hợp pháp đối với mọi hình ảnh, văn bản và âm thanh tải lên nền tảng.
              Nghiêm cấm đăng tải nội dung đồi trụy, thù địch, vi phạm pháp luật Việt Nam hoặc xâm phạm quyền riêng tư của cá nhân khác mà không có sự đồng thuận.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-slate-900">2. Gói dịch vụ số & Thanh toán</h2>
            <p>
              Các gói dịch vụ tạo thiệp được thanh toán một lần cho từng thiệp mời. Trong giai đoạn P0, việc xác nhận thanh toán được thực hiện đối soát thủ công bởi quản trị viên qua chuyển khoản ngân hàng hoặc cổng tích hợp được kiểm tra.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-slate-900">3. Giới hạn trách nhiệm</h2>
            <p>
              Ding Dong Gift cung cấp công cụ tạo thiệp mời và kết nối thông tin đối tác. Nền tảng không chịu trách nhiệm đối với các tranh chấp phát sinh giữa người mua và các shop hoa/quà vật lý về chất lượng hoa, thời gian giao vận ngoài phạm vi công nghệ số.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

