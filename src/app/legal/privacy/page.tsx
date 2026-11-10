import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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

        {/* Notice of Legal Review */}
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Ghi chú bắt buộc về tuân thủ pháp lý:</p>
            <p className="mt-1 leading-relaxed">
              Tài liệu này là thông số kỹ thuật và điều khoản mẫu ban đầu. Trước khi đưa vào vận hành thương mại chính thức,
              nền tảng phải được rà soát và phê duyệt bởi luật sư có chứng chỉ hành nghề theo quy định của <strong>Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15</strong> (hiệu lực 01/01/2026) và các quy định thương mại điện tử hiện hành.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-serif font-bold text-slate-900">
            Chính Sách Bảo Vệ Dữ Liệu Cá Nhân
          </h1>
          <p className="text-xs text-slate-500">Phiên bản 1.0 — Cập nhật ngày 04/11/2026</p>
        </div>

        <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-6 text-slate-700">
          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-slate-900">1. Mục đích thu thập dữ liệu</h2>
            <p>
              Ding Dong Gift thu thập và xử lý các thông tin cần thiết phục vụ cho việc tạo, hiển thị mini website thiệp mời,
              xử lý phản hồi tham dự (RSVP), sổ lưu bút, kết nối đơn hoa quà đối tác và đối soát hoa hồng tiếp thị liên kết.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-slate-900">2. Các loại dữ liệu được xử lý</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Thông tin tài khoản: Họ tên, địa chỉ email, mật khẩu đã được băm an toàn (bcrypt).</li>
              <li>Thông tin sự kiện: Tên người tổ chức, ngày giờ, địa điểm sự kiện, hình ảnh kỷ niệm được tải lên.</li>
              <li>Thông tin phản hồi khách: Họ tên khách mời, số lượng người tham dự, lời nhắn chúc mừng.</li>
              <li>Thông tin giao quà: Tên người nhận, số điện thoại và địa chỉ giao hàng (chỉ chia sẻ với shop được chỉ định khi khách gửi yêu cầu).</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-slate-900">3. Quyền riêng tư theo mặc định</h2>
            <p>
              Mọi thiệp mời tạo ra trên Ding Dong Gift được đặt ở chế độ <strong>UNLISTED</strong> theo mặc định. Thiệp không xuất hiện trên các công cụ tìm kiếm công cộng (Google) và chỉ những ai có liên kết hoặc mã QR mới có thể xem được. Chủ thiệp có quyền khóa thiệp bằng mật mã (PASSWORD) hoặc lưu trữ (ARCHIVED) bất kỳ lúc nào.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-serif font-bold text-slate-900">4. Quyền của chủ thể dữ liệu</h2>
            <p>
              Theo Luật 91/2025/QH15, bạn có quyền biết, đồng ý, truy cập, chỉnh sửa, yêu cầu xóa hoặc phản đối việc xử lý dữ liệu cá nhân của mình bằng cách liên hệ với ban quản trị hoặc sử dụng tính năng xuất/xóa dữ liệu trong trang quản lý tài khoản.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

