import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";
import { generateShortCode } from "@/lib/utils/slug";
import { CATALOG_PRODUCTS } from "@/data/catalogData";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const inv = await prisma.invitation.findUnique({
      where: { id: params.id },
      include: {
        templateVersion: {
          include: { template: true },
        },
        revisions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
        shareLinks: true,
      },
    });

    if (!inv) {
      return apiError("Không tìm thấy thiệp mời.", "NOT_FOUND", 404);
    }

    if (inv.ownerId !== user.id && !user.roles.includes("ADMIN")) {
      return apiError("Bạn không có quyền mở khóa thiệp mời này.", "FORBIDDEN", 403);
    }

    // Verify template price: free only when catalog price is 0 (or fallback non-premium template)
    const templateSlug = inv.templateVersion.template.slug;
    const catalogItem = CATALOG_PRODUCTS.find((p) => p.slug === templateSlug);
    const isFree = catalogItem ? catalogItem.price === 0 : !inv.templateVersion.template.isPremium;

    if (!isFree && inv.status !== "PUBLISHED") {
      // Must check if user paid or has entitlement
      const entitlement = await prisma.entitlement.findFirst({
        where: {
          ownerId: user.id,
          invitationId: inv.id,
          status: "ACTIVE",
        },
      });

      if (!entitlement) {
        return apiError("Mẫu thiệp này yêu cầu thanh toán để mở khóa.", "PAYMENT_REQUIRED", 402);
      }
    }

    // Ensure share link
    let shortCode = inv.shareLinks[0]?.shortCode;
    if (!shortCode) {
      shortCode = generateShortCode();
      await prisma.shareLink.create({
        data: {
          invitationId: inv.id,
          shortCode,
          label: "DEFAULT_SHARE",
        },
      });
    }

    // Default duration 30 days
    const expiresAt = inv.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const updated = await prisma.invitation.update({
      where: { id: inv.id },
      data: {
        status: "PUBLISHED",
        publishedAt: inv.publishedAt || new Date(),
        expiresAt,
      },
    });

    await logAudit({
      actorId: user.id,
      actorRole: user.roles[0],
      action: "INVITATION_UNLOCKED",
      resourceType: "Invitation",
      resourceId: inv.id,
      afterSummary: { slug: updated.slug, status: updated.status, expiresAt },
    });

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const publicUrl = `${protocol}://${host}/i/${updated.slug}`;
    const shortUrl = `${protocol}://${host}/q/${shortCode}`;

    return apiSuccess({
      status: updated.status,
      slug: updated.slug,
      shortCode,
      publicUrl,
      shortUrl,
      publishedAt: updated.publishedAt,
      expiresAt: updated.expiresAt,
      message: "Mở khóa thành công! Món quà đã sẵn sàng.",
    });
  } catch (err) {
    return handleApiError(err);
  }
}

