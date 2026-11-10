"use client";

import { DollarSign, Heart, Sparkles, TrendingUp, CheckCircle, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/data/landingData";

export interface BenefitItem {
  id: string;
  icon: typeof DollarSign;
  title: string;
  description: string;
  highlight?: string;
}

const BENEFITS: BenefitItem[] = [
  {
    id: "benefit-1",
    icon: DollarSign,
    title: "Hoa hồng 10% hấp dẫn",
    highlight: "10% trọn đời",
    description:
      "Nhận ngay 10% hoa hồng trực tiếp trên mỗi đơn hàng thiệp mời hoặc mini website thành công qua liên kết giới thiệu của bạn. Thanh toán định kỳ minh bạch về tài khoản ngân hàng.",
  },
  {
    id: "benefit-2",
    icon: Heart,
    title: "Đánh trúng cảm xúc khách hàng",
    highlight: "Tỷ lệ chuyển đổi cao",
    description:
      "Nhu cầu tạo thiệp mời online tương tác đang bùng nổ mạnh mẽ tại Việt Nam. Trải nghiệm chạm lướt cảm xúc, mở phong bì độc đáo giúp khách hàng dễ dàng đưa ra quyết định mua.",
  },
  {
    id: "benefit-3",
    icon: Sparkles,
    title: "Sản phẩm độc đáo, dễ bán",
    highlight: "50+ mẫu đa dạng",
    description:
      "Kho mẫu phong phú cho đám cưới, sinh nhật, thôi nôi, tốt nghiệp và tỏ tình. Tích hợp mã QR in ấn sắc nét, âm nhạc tùy chọn và hệ thống RSVP thông minh không đối thủ.",
  },
];

export default function PartnerBenefitCard() {
  return (
    <section className="py-14 sm:py-18 bg-white">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
        {/* Centered Heading with Coral -> Pink Gradient & Heart Icon */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
          <div className="inline-flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-[#fa416a] fill-[#fa416a]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#fa416a]">
              Lợi ích đối tác
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold bg-gradient-to-r from-[#ff6b61] to-[#fa416a] bg-clip-text text-transparent tracking-tight">
            Vì sao nên hợp tác với {siteConfig.brandName}?
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 mt-2.5 leading-relaxed">
            Chúng tôi cam kết xây dựng chính sách hợp tác minh bạch, công bằng và hỗ trợ tối đa cho từng đối tác cộng tác viên.
          </p>
        </div>

        {/* Row of 3 Cards: ~350px width each, equal height, gap ~20px */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 justify-center">
          {BENEFITS.map((item) => {
            const IconComp = item.icon;

            return (
              <div
                key={item.id}
                className="flex flex-col bg-white rounded-[16px] border border-rose-100 shadow-[0_4px_20px_rgba(250,65,106,0.04)] hover:shadow-[0_8px_30px_rgba(250,65,106,0.1)] transition-all duration-300 p-8 sm:p-9 text-center group"
              >
                {/* Pink Icon (38-44px) at top */}
                <div className="w-12 h-12 rounded-2xl bg-[#fff0f3] group-hover:bg-rose-100 text-[#fa416a] mx-auto flex items-center justify-center mb-5 transition-transform group-hover:scale-110 shadow-xs">
                  <IconComp className="w-6 h-6 stroke-[1.8]" />
                </div>

                {/* Highlight Badge */}
                {item.highlight && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#fa416a] bg-rose-50 border border-rose-200/60 mx-auto mb-2.5">
                    {item.highlight}
                  </span>
                )}

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 mb-3 leading-snug">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-[13px] text-[#777] leading-[1.6] mt-auto">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* 4-Step How It Works Section */}
        <div className="mt-16 pt-12 border-t border-slate-100">
          <div className="text-center mb-10">
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
              Quy trình 4 bước bắt đầu kiếm thu nhập
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Đơn giản, tự động và không cần vốn hay kinh nghiệm kỹ thuật
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              {
                step: "01",
                title: "Đăng ký tài khoản",
                desc: "Tạo tài khoản và đăng ký chương trình Cộng tác viên hoàn toàn miễn phí.",
              },
              {
                step: "02",
                title: "Nhận liên kết riêng",
                desc: "Hệ thống cấp ngay mã định danh và link giới thiệu độc quyền cho bạn.",
              },
              {
                step: "03",
                title: "Chia sẻ & Lan tỏa",
                desc: "Chia sẻ mẫu thiệp đến bạn bè, cặp đôi sắp cưới hoặc đăng lên mạng xã hội.",
              },
              {
                step: "04",
                title: "Nhận hoa hồng 10%",
                desc: "Khách thanh toán thành công, hoa hồng 10% tự động cộng vào ví của bạn.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/70 relative"
              >
                <span className="text-2xl font-black text-rose-300 font-mono block mb-2">
                  {s.step}
                </span>
                <h4 className="text-sm font-bold text-slate-900 mb-1">{s.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

