import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { CreditCard, Users, Store, Shield, Flag, Gift } from "lucide-react";

export default async function AdminPortalPage() {
  const user = await getCurrentUser();
  if (!user || !user.roles.includes("ADMIN")) {
    redirect("/dashboard");
  }

  const sections = [
    {
      title: "Thanh toán & Đối soát",
      desc: "Xem đơn hàng, duyệt chuyển khoản ngân hàng thủ công, cấp quyền gói và hoàn tiền.",
      href: "/admin/payments",
      icon: CreditCard,
      color: "from-blue-500 to-indigo-600",
    },
    {
      title: "Cộng tác viên (Affiliate)",
      desc: "Phê duyệt đơn đăng ký CTV, cấp mã link giới thiệu và quản lý đối soát hoa hồng 10%.",
      href: "/admin/affiliates",
      icon: Users,
      color: "from-emerald-500 to-teal-600",
    },
    {
      title: "Đối tác Shop & Quà tặng",
      desc: "Xét duyệt hồ sơ đối tác cửa hàng hoa, quà tặng và quản lý danh mục sản phẩm đối tác.",
      href: "/admin/shops",
      icon: Store,
      color: "from-rose-500 to-pink-600",
    },
    {
      title: "Thẻ QR Vật Lý (Gift Cards)",
      desc: "Tạo các lô thẻ QR vật lý in ấn, mã kích hoạt bí mật cào và quản lý trạng thái.",
      href: "/admin/gift-cards",
      icon: Gift,
      color: "from-purple-500 to-indigo-600",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Control Panel</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">
            Trung tâm Quản trị Nền tảng Ding Dong Gift
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý tài khoản, đơn hàng, hoa hồng đối tác và hệ sinh thái dịch vụ.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sections.map((sec, idx) => {
            const Icon = sec.icon;
            return (
              <Link
                key={idx}
                href={sec.href}
                className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${sec.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif font-bold text-slate-900 text-lg group-hover:text-indigo-600 transition-colors">
                    {sec.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{sec.desc}</p>
                </div>
                <div className="pt-6 text-xs font-semibold text-indigo-600 flex items-center gap-1">
                  <span>Truy cập quản lý</span>
                  <span>→</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

