import { z } from "zod";
import prisma from "@/lib/prisma";
import { apiSuccess } from "@/lib/api/response";
import { requireShopAdminOnly } from "@/lib/shop/auth";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import { adjustVariantInventory } from "@/lib/shop/inventory";
import { getShopSettings, saveShopSettings } from "@/lib/shop/settings";

const ActionSchema = z.object({
  mode: z.enum(["PUBLISH_SAMPLE_CATALOG", "REVERT_SAMPLE_TO_DRAFT"]),
});

export async function POST(req: Request) {
  try {
    const user = await requireShopAdminOnly();
    const body = ActionSchema.parse(await req.json());
    const settings = await getShopSettings();

    if (body.mode === "PUBLISH_SAMPLE_CATALOG") {
      const products = await prisma.storeProduct.findMany({
        include: { variants: { include: { inventory: true } } },
      });
      for (const p of products) {
        if (p.status === "DRAFT") {
          await prisma.storeProduct.update({
            where: { id: p.id },
            data: { status: "ACTIVE" },
          });
        }
        for (const v of p.variants) {
          const onHand = v.inventory?.onHand ?? 0;
          if (onHand === 0) {
            await adjustVariantInventory({
              variantId: v.id,
              deltaOnHand: 20,
              type: "IMPORT",
              reason: "Nhập tồn kho thử nghiệm QA từ Admin",
              actorId: user.id,
            });
          }
        }
      }
      await saveShopSettings(
        {
          ...settings,
          demoSeedPublished: true,
          shipping: {
            ...settings.shipping,
            configured: true,
          },
        },
        user.id,
      );
      return apiSuccess({ mode: body.mode, updatedProducts: products.length });
    }

    await prisma.storeProduct.updateMany({
      where: { status: "ACTIVE" },
      data: { status: "DRAFT" },
    });
    await saveShopSettings({ ...settings, demoSeedPublished: false }, user.id);
    return apiSuccess({ mode: body.mode });
  } catch (err) {
    return handleShopApiError(err);
  }
}

