import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import LogoutButton from "@/components/auth/LogoutButton";
import { syncPendingPayOSOrdersForUser } from "@/lib/payments/payos";
import { PlusCircle, Sparkles, Eye, Users, QrCode, ExternalLink, Edit3, Heart, Shield, Store, Coins, Settings } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/sign-in");
  }

  await syncPendingPayOSOrdersForUser(user.id);

  const invitations = await prisma.invitation.findMany({
    where: { ownerId: user.id },
    include: {
      occasion: true,
      templateVersion: {
        include: {
          template: true,
        },
      },
      rsvps: true,
      statsDaily: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const totalInvitations = invitations.length;
  const totalRsvps = invitations.reduce((acc, inv) => acc + inv.rsvps.length, 0);
  const totalViews = invitations.reduce(
    (acc, inv) => acc + inv.statsDaily.reduce((sum, s) => sum + s.views, 0),
    0
  );

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-serif font-bold text-slate-900">
                Chào mừng trở lại, {user.name} 👋
              </h1>
              {user.roles.includes("ADMIN") && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                  Admin
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Quản lý các mini website thiệp mời, theo dõi phản hồi khách và liên kết thẻ quà tặng.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* AI Credits balance chip */}
            <Link
              href="/dashboard/account"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-xl text-xs font-semibold transition-colors"
              title="Xem số dư AI Credits"
            >
              <Coins className="w-3.5 h-3.5 text-amber-600" />
              <span>{user.imageCredits} 🖼️ / {user.audioCredits} 🎵</span>
            </Link>

            {/* Account Settings button */}
            <Link
              href="/dashboard/account"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium shadow-xs transition-colors"
              title="Quản lý hồ sơ và đổi mật khẩu"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500" />
              <span>Tài khoản</span>
            </Link>

            {/* Fast access for Admin */}
            {user.roles.includes("ADMIN") && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Portal</span>
              </Link>
            )}

            {/* Fast access for Shop Owner */}
            {(user.roles.includes("SHOP_OWNER") || user.roles.includes("SHOP_STAFF")) && (
              <Link
                href="/shop/dashboard"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Kênh Shop</span>
              </Link>
            )}

            <LogoutButton />

            <Link
              href="/create"
              className="inline-flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs rounded-xl shadow-md shadow-rose-200 transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tạo thiệp mới</span>
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-rose-100/60 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Tổng số thiệp</p>
              <p className="text-2xl font-bold text-slate-800">{totalInvitations}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rose-100/60 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Lượt xem ước tính</p>
              <p className="text-2xl font-bold text-slate-800">{totalViews}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rose-100/60 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Phản hồi khách (RSVP)</p>
              <p className="text-2xl font-bold text-slate-800">{totalRsvps}</p>
            </div>
          </div>
        </div>

        {/* Invitations List */}
        <div className="space-y-4">
          <h2 className="text-lg font-serif font-bold text-slate-900">Danh sách thiệp mời của bạn</h2>

          {invitations.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-rose-200">
              <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-4">
                <Heart className="w-8 h-8" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">Chưa có thiệp mời nào</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-6">
                Bạn chưa tạo thiệp nào. Hãy chọn một dịp đặc biệt để bắt đầu tạo mini website tinh tế!
              </p>
              <Link
                href="/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-full shadow-sm transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Bắt đầu tạo ngay</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {invitations.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                >
                  <div className="p-5 flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700">
                        {inv.occasion.title}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${
                          inv.status === "PUBLISHED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {inv.status === "PUBLISHED" ? "Đã xuất bản" : "Bản nháp"}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">{inv.title}</h3>
                    <p className="text-xs text-slate-500">
                      Mẫu: {inv.templateVersion.template.title}
                    </p>

                    <div className="text-xs text-slate-500 flex items-center gap-4 pt-1">
                      <span>RSVP: {inv.rsvps.length}</span>
                      <span>Chế độ: {inv.privacyMode}</span>
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs font-medium">
                    <Link
                      href={`/editor/${inv.id}`}
                      className="flex items-center gap-1 text-slate-700 hover:text-rose-600"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Chỉnh sửa</span>
                    </Link>

                    {inv.status === "PUBLISHED" ? (
                      <Link
                        href={`/i/${inv.slug}`}
                        target="_blank"
                        className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold"
                      >
                        <span>Mở thiệp</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <span className="text-slate-400">Chưa public</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
