import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { serializeStoreProduct } from "@/lib/shop/api-helpers";
import { getShopActorFromRoles } from "@/lib/shop/auth";
import { getEligibleShopTemplates } from "@/lib/shop/gift-card";
import ShopLandingClient, {
  LandingShowcaseCard,
} from "@/components/shop/ShopLandingClient";

export const dynamic = "force-dynamic";

export default async function ShopLandingPage() {
  const [user, categories, featuredRaw, draftCount, templatesRes] =
    await Promise.all([
      getCurrentUser(),
      prisma.storeCategory.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          _count: {
            select: {
              products: { where: { status: "ACTIVE" } },
            },
          },
        },
      }),
      prisma.storeProduct.findMany({
        where: { status: "ACTIVE" },
        include: {
          category: { select: { id: true, slug: true, name: true } },
          variants: {
            where: { isActive: true },
            include: { inventory: true },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
        take: 48,
      }),
      prisma.storeProduct.count({ where: { status: "DRAFT" } }),
      getEligibleShopTemplates(),
    ]);

  const isStaff = user ? getShopActorFromRoles(user.roles).canManageShop : false;

  const showcaseCards: LandingShowcaseCard[] = templatesRes.templates
    .slice(0, 8)
    .map((t) => ({
      slug: t.slug,
      title: t.title,
      subtitle: t.description,
      imageUrl: t.previewUrl,
      href: `/qua-tang/tat-ca?template=${encodeURIComponent(t.slug)}`,
      tag: t.badge || t.occasionTitle,
    }));

  return (
    <ShopLandingClient
      categories={categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        coverImage: c.coverImage,
        activeProductCount: c._count.products,
      }))}
      featuredProducts={featuredRaw.map((p) => serializeStoreProduct(p))}
      showcaseCards={showcaseCards}
      isStaffUser={isStaff}
      draftProductCount={draftCount}
    />
  );
}

