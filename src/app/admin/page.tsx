import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { CreditCard, Users, Store, Gift, Share2, Activity, ArrowRight, UserCheck } from "lucide-react";
import { BrandMark } from "@/components/common/BrandLogo";

export const dynamic = "force-dynamic";

export default async function AdminPortalPage() {
  const user = await getCurrentUser();
  if (!user || !user.roles.includes("ADMIN")) {
    redirect("/dashboard");
  }

  const [totalUsers, totalOrders, totalShops, totalGiftCards] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.shop.count(),
    prisma.giftCard.count(),
  ]);

  const sections = [
    {
      title: "Người dùng & Phân quyền",
      desc: "Quản lý danh sách tài khoản, gán quyền Quản trị/Chủ shop/CTV, kích hoạt/khóa tài khoản và cấp credits.",
      href: "/admin/users",
      icon: UserCheck,
      color: "from-purple-600 to-indigo-700",
      badge: `${totalUsers} tài khoản`,
    },
    {
      title: "Thanh toán & Đối soát",
      desc: "Xem đơn hàng, duyệt chuyển khoản ngân hàng thủ công, cấp quyền gói và xử lý hoàn tiền.",
      href: "/admin/payments",
      icon: CreditCard,
      color: "from-blue-500 to-indigo-600",
      badge: `${totalOrders} đơn hàng`,
    },
    {
      title: "Đối tác Shop & Quà tặng",
      desc: "Xét duyệt hồ sơ đối tác cửa hàng hoa, quà tặng và quản lý danh mục sản phẩm đối tác.",
      href: "/admin/shops",
      icon: Store,
      color: "from-rose-500 to-pink-600",
      badge: `${totalShops} cửa hàng`,
    },
    {
      title: "Cộng tác viên (Affiliate)",
      desc: "Phê duyệt đơn đăng ký CTV, cấp mã link giới thiệu và quản lý đối soát hoa hồng 10%.",
      href: "/admin/affiliates",
      icon: Share2,
      color: "from-emerald-500 to-teal-600",
      badge: "Hoa hồng 10%",
    },
    {
      title: "Thẻ QR Vật Lý (Gift Cards)",
      desc: "Tạo các lô thẻ QR vật lý in ấn, mã kích hoạt bí mật cào và quản lý trạng thái.",
      href: "/admin/gift-cards",
      icon: Gift,
      color: "from-amber-500 to-orange-600",
      badge: `${totalGiftCards} thẻ`,
    },
  ];

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-rose-500/10 to-transparent pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold backdrop-blur-xs border border-amber-400/30">
              <BrandMark size="xs" surface="pill" alt="" />
              <span>Admin Control Center • Ding Dong Gift</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight">
              Trung tâm Quản trị Toàn diện
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Quản trị người dùng, phân quyền truy cập (RBAC), kiểm soát giao dịch thanh toán,
              mạng lưới cửa hàng đối tác và thẻ quà tặng vật lý.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
            <div>
              <p className="text-xs text-slate-400 font-medium">Tổng người dùng</p>
              <p className="text-2xl font-bold text-white mt-0.5">{totalUsers}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Tổng đơn hàng</p>
              <p className="text-2xl font-bold text-white mt-0.5">{totalOrders}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Cửa hàng đối tác</p>
              <p className="text-2xl font-bold text-white mt-0.5">{totalShops}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Thẻ QR vật lý</p>
              <p className="text-2xl font-bold text-white mt-0.5">{totalGiftCards}</p>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-serif font-bold text-slate-900">Các phân hệ quản trị</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sections.map((sec, idx) => {
              const Icon = sec.icon;
              return (
                <Link
                  key={idx}
                  href={sec.href}
                  className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-slate-300 transition-all flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${sec.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full group-hover:bg-rose-50 group-hover:text-rose-600 transition-colors">
                        {sec.badge}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-slate-900 text-lg group-hover:text-rose-600 transition-colors">
                        {sec.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1.5">{sec.desc}</p>
                    </div>
                  </div>
                  <div className="pt-6 text-xs font-semibold text-rose-600 flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                    <span>Truy cập quản lý</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
