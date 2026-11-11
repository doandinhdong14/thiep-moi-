import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import {
  CreditCard,
  Users,
  Store,
  Gift,
  Share2,
  Activity,
  ArrowRight,
  UserCheck,
  Sparkles,
  NotebookPen,
  Eye,
  EyeOff,
} from "lucide-react";
import { BrandMark } from "@/components/common/BrandLogo";
import { getAllTemplatesOrdered, isTemplateVisible } from "@/lib/templates/registry";
import { getAdminTemplatesConfig } from "@/lib/templates/adminConfig";

export const dynamic = "force-dynamic";

export default async function AdminPortalPage() {
  const user = await getCurrentUser();
  if (!user || !user.roles.includes("ADMIN")) {
    redirect("/dashboard");
  }

  const [totalUsers, totalOrders, totalShops, totalGiftCards, templatesConfig] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.shop.count(),
    prisma.giftCard.count(),
    getAdminTemplatesConfig(),
  ]);

  const allTemplates = getAllTemplatesOrdered();
  const visibleTemplates = allTemplates.filter((t) =>
    isTemplateVisible(t, templatesConfig.visibilityOverrides)
  );
  const hiddenTemplates = allTemplates.filter(
    (t) => !isTemplateVisible(t, templatesConfig.visibilityOverrides)
  );

  const sections = [
    {
      title: "Kho Mẫu Thiệp & Ghi chú (#01–#10)",
      desc: "Xem danh sách 10 mẫu đã đưa vào đánh số #01–#10, bật/tắt ẩn hiện các mẫu gốc và lưu sổ tay ghi chú vận hành.",
      href: "/admin/templates",
      icon: Sparkles,
      color: "from-rose-600 to-fuchsia-600",
      badge: `${visibleTemplates.length} hiện / ${hiddenTemplates.length} ẩn`,
    },
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

        {/* Immediate Overview of Numbered Templates & Admin Notes */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <NotebookPen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-serif font-bold text-slate-900">
                  Sổ Tay Đánh Số Mẫu Thiệp (#01 – #{String(visibleTemplates.length).padStart(2, "0")}) & Ghi Chú Admin
                </h2>
                <p className="text-xs text-slate-500">
                  Tổng hợp đầy đủ trạng thái các mẫu bạn đã đưa vào, file HTML nguồn và danh sách {hiddenTemplates.length} mẫu gốc đang ẩn.
                </p>
              </div>
            </div>

            <Link
              href="/admin/templates"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-semibold shrink-0 w-fit"
            >
              <span>Quản lý Ẩn/Hiện & Sửa Ghi chú</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 pr-3">Số #</th>
                  <th className="py-2.5 px-3">Slug / File HTML</th>
                  <th className="py-2.5 px-3">Tên mẫu</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 pl-3">Ghi chú nhanh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleTemplates.map((tpl, idx) => (
                  <tr key={tpl.slug} className="hover:bg-slate-50/70">
                    <td className="py-2.5 pr-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-[11px]">
                        {tpl.numberCode || `#${String(idx + 1).padStart(2, "0")}`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                      <div>{tpl.slug}</div>
                      <div className="text-[10px] text-slate-400">{tpl.sourceFile}</div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      <Link href={`/templates/${tpl.slug}`} className="hover:text-rose-600">
                        {tpl.title}
                      </Link>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                        <Eye className="w-3 h-3" />
                        <span>Đang hiện</span>
                      </span>
                    </td>
                    <td className="py-2.5 pl-3 text-slate-600 max-w-md">
                      {templatesConfig.templateNotes[tpl.slug] || tpl.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hiddenTemplates.length > 0 && (
            <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <EyeOff className="w-4 h-4 text-slate-400 shrink-0" />
                <span>
                  <strong>{hiddenTemplates.length} mẫu gốc đang ẩn khỏi khách hàng:</strong>{" "}
                  {hiddenTemplates.map((t) => t.slug).join(", ")}
                </span>
              </div>
              <Link href="/admin/templates" className="text-rose-600 font-semibold hover:underline">
                Xem hoặc bật lại →
              </Link>
            </div>
          )}

          <div className="rounded-2xl bg-amber-50/60 border border-amber-200/70 p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Ghi chú vận hành chi tiết
            </h3>
            <pre className="whitespace-pre-wrap font-mono text-[11.5px] leading-relaxed text-slate-700 overflow-x-auto">
              {templatesConfig.generalNotes}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
