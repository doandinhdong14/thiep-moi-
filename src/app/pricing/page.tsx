import Link from "next/link";
import prisma from "@/lib/prisma";
import { Check, Sparkles, HelpCircle } from "lucide-react";
import PlanSelectButton from "@/components/pricing/PlanSelectButton";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const plans = await prisma.plan.findMany({
    where: { active: true },
    include: { features: true },
    orderBy: { sortOrder: "asc" },
  });

  const faqs = [
    {
      q: "Gói dịch vụ thanh toán một lần hay định kỳ?",
      a: "Tất cả các gói dịch vụ tại Ding Dong Gift đều là thanh toán một lần duy nhất cho mỗi thiệp mời, không tự động gia hạn và không phát sinh chi phí ẩn.",
    },
    {
      q: "Khách của tôi có cần tạo tài khoản để xem thiệp hay gửi RSVP không?",
      a: "Hoàn toàn không. Khách chỉ cần mở đường dẫn hoặc quét mã QR là có thể xem nội dung thiệp và gửi lời chúc / phản hồi tham dự ngay tức thì.",
    },
    {
      q: "Tôi có thể chỉnh sửa nội dung thiệp sau khi đã in mã QR không?",
      a: "Có! Mã QR của Ding Dong Gift là mã QR động liên kết với đường link ổn định. Bất cứ khi nào bạn cập nhật thông tin trên website, khách quét mã cũ vẫn sẽ thấy bản cập nhật mới nhất.",
    },
    {
      q: "Chính sách hoa hồng 10% của Cộng tác viên hoạt động thế nào?",
      a: "Khi bạn đăng ký làm CTV và được duyệt, hệ thống cấp link giới thiệu riêng. Bất kỳ khách hàng nào nhấn vào link và mua gói dịch vụ số hợp lệ, bạn nhận ngay 10% hoa hồng trên số tiền thanh toán thực tế.",
    },
  ];

  return (
    <div className="flex-1 bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-16">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-rose-600" />
            <span>Minh Bạch & Tiết Kiệm</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-slate-900">
            Bảng giá dịch vụ tạo thiệp & Mini Website
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Bắt đầu hoàn toàn miễn phí hoặc nâng cấp để mở khóa album không giới hạn, nhạc nền và bỏ hình mờ thương hiệu.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p) => {
            const isFeatured = p.code === "PREMIUM";
            return (
              <div
                key={p.id}
                className={`bg-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between border transition-all ${
                  isFeatured
                    ? "border-rose-400 shadow-xl shadow-rose-100 ring-2 ring-rose-500 scale-105"
                    : "border-slate-200/80 shadow-sm hover:shadow-md"
                }`}
              >
                <div className="space-y-4">
                  {isFeatured && (
                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500 text-white">
                      Phổ biến nhất
                    </span>
                  )}
                  <h3 className="text-xl font-serif font-bold text-slate-900">{p.name}</h3>

                  <div className="pt-2">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {p.basePriceVnd === 0 ? "Miễn Phí" : `${p.basePriceVnd.toLocaleString("vi-VN")} đ`}
                    </span>
                    <span className="text-xs text-slate-500 block mt-1">
                      Thời hạn lưu trữ: {p.defaultDurationDays} ngày
                    </span>
                  </div>

                  <ul className="space-y-3 pt-6 border-t border-slate-100 text-xs text-slate-600">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Mini website tương tác & mã QR</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Form xác nhận tham dự (RSVP)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>{p.basePriceVnd === 0 ? "Watermark Ding Dong Gift" : "Bỏ hình mờ (No watermark)"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>{p.basePriceVnd >= 99000 ? "Tải lên nhạc nền & Sổ lưu bút" : "Nhạc nền tiêu chuẩn"}</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span>Xuất ảnh poster & tài liệu PDF in ấn</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-8">
                  <PlanSelectButton
                    planCode={p.code}
                    isFree={p.basePriceVnd === 0}
                    isFeatured={isFeatured}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto pt-8 border-t border-slate-200 space-y-8">
          <h2 className="text-2xl font-serif font-bold text-center text-slate-900">
            Câu hỏi thường gặp
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                  <span>{faq.q}</span>
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

