import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getShopActorFromRoles } from "@/lib/shop/auth";
import AdminShopNav from "@/components/shop/AdminShopNav";

export const dynamic = "force-dynamic";

export default async function AdminShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login?callbackUrl=/admin/qua-tang");
  }

  const actor = getShopActorFromRoles(user.roles);
  if (!actor.canManageShop) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-clip">
      <AdminShopNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</div>
    </div>
  );
}

