import Link from "next/link";
import { ShieldCheck, Users, Headphones, ArrowRight } from "lucide-react";
import { trustCollageImages } from "@/data/landingData";

export default function TrustSection() {
  const benefits = [
    {
      icon: ShieldCheck,
      title: "Thanh toán an toàn & Tự động",
      desc: "Hỗ trợ quét mã VietQR ngân hàng kích hoạt ngay sau 30 giây, bảo mật thông tin mã hóa chuẩn SSL 256-bit.",
    },
    {
      icon: Users,
      title: "Hơn 10.000+ Khách hàng tin tưởng",
      desc: "Được hàng ngàn cặp đôi, gia đình và tập thể lớp chọn mặt gửi vàng cho những sự kiện trọng đại nhất cuộc đời.",
    },
    {
      icon: Headphones,
      title: "Đội ngũ hỗ trợ đồng hành 24/7",
      desc: "Tư vấn tận tình từ cách chèn nhạc nền, chọn layout đến cách chia sẻ link và xuất mã QR in ấn chuyên nghiệp.",
    },
  ];

  return (
    <section className="py-14 lg:py-20 bg-white overflow-hidden">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column: Copy, Benefits & CTA */}
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-[36px] font-bold bg-gradient-to-r from-[#ff6b61] to-[#fa416a] bg-clip-text text-transparent leading-tight mb-4">
              Vì Sao Khách Hàng<br />Tin Tưởng Ding Dong Gift?
            </h2>

            <p className="text-sm text-[#73737d] leading-relaxed mb-8 max-w-md">
              Chúng mình chăm chút từng pixel và từng nốt nhạc để thiệp mời của bạn trở thành kỷ niệm đẹp nhất.
            </p>

            {/* 3 Benefit Rows */}
            <div className="space-y-6 mb-8">
              {benefits.map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-full bg-white border border-rose-100 shadow-[0_3px_12px_rgba(250,65,106,0.12)] flex items-center justify-center text-[#fa416a] shrink-0 mt-0.5">
                      <IconComp className="w-5 h-5 stroke-[1.8]" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-[#19191f] mb-1">
                        {item.title}
                      </h3>
                      <p className="text-[13px] text-[#73737d] leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA Button */}
            <div>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#ff6b61] to-[#fa416a] hover:opacity-95 text-white font-bold text-sm rounded-full shadow-[0_10px_25px_rgba(250,65,106,0.25)] transition-all hover:scale-105 active:scale-95 group"
              >
                <span>Bắt đầu tạo ngay</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Right Column: 3 Staggered Imagery Cards Collage */}
          <div className="relative pt-6 pb-10 flex flex-col items-center justify-center">
            {/* Collage Container */}
            <div className="relative w-full max-w-[420px] h-[400px] sm:h-[460px] mx-auto">
              {/* Image 1: Main left photo (rotated -3deg) */}
              <div className="absolute left-0 top-0 z-10 w-[240px] sm:w-[270px] aspect-[3/4] rounded-[16px] overflow-hidden shadow-2xl border-4 border-white -rotate-3 transition-transform duration-300 hover:rotate-0 hover:z-30">
                <img
                  src={trustCollageImages[0].url}
                  alt={trustCollageImages[0].alt}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Image 2: Higher top right photo (rotated 4deg) */}
              <div className="absolute right-0 top-6 z-20 w-[200px] sm:w-[230px] aspect-[3/4] rounded-[16px] overflow-hidden shadow-2xl border-4 border-white rotate-4 transition-transform duration-300 hover:rotate-0 hover:z-30">
                <img
                  src={trustCollageImages[1].url}
                  alt={trustCollageImages[1].alt}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Image 3: Lower overlapping photo (rotated -5deg) */}
              <div className="absolute left-16 sm:left-24 bottom-2 z-25 w-[190px] sm:w-[220px] aspect-[4/3] rounded-[16px] overflow-hidden shadow-2xl border-4 border-white -rotate-5 transition-transform duration-300 hover:rotate-0 hover:z-30">
                <img
                  src={trustCollageImages[2].url}
                  alt={trustCollageImages[2].alt}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

