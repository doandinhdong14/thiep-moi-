import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import PartnerHero from "@/components/partners/PartnerHero";
import PartnerBenefitCard from "@/components/partners/PartnerBenefitCard";

export const metadata: Metadata = {
  title: "Chương Trình Đối Tác & Cộng Tác Viên | Ding Dong Gift",
  description:
    "Trở thành đối tác cộng tác viên của Ding Dong Gift để nhận hoa hồng hấp dẫn 10% trên mỗi đơn hàng thiệp mời và mini website thành công.",
};

export default function PartnersPage() {
  return (
    <div className="flex-1 bg-white min-h-[calc(100svh-64px)]">
      {/* 1. Partner Hero Section */}
      <PartnerHero />

      {/* 2. Benefit Section */}
      <PartnerBenefitCard />

      {/* 3. Bottom CTA Section */}
      <section className="py-14 sm:py-16 bg-gradient-to-b from-white to-[#fff0f3] border-t border-rose-100">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100 text-[#fa416a] text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Khởi đầu dễ dàng trong 2 phút</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Sẵn sàng gia tăng thu nhập cùng Ding Dong Gift?
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Hàng ngàn bạn trẻ, studio áo cưới, nhà tổ chức tiệc và người sáng tạo nội dung đã tham gia. Hãy bắt đầu ngay hôm nay!
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <Link
              href="/affiliate/apply"
              className="flex items-center gap-2 h-11 px-7 rounded-full bg-gradient-to-r from-[#ff6b61] to-[#fa416a] hover:opacity-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-200 transition-all hover:scale-105"
            >
              <span>Đăng ký làm đối tác ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/affiliate/dashboard"
              className="flex items-center gap-2 h-11 px-7 rounded-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs sm:text-sm font-semibold transition-colors"
            >
              <span>Vào trang quản lý CTV</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

