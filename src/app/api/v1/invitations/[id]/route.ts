import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";
import { InvitationContentSchema } from "@/lib/templates/schema";
import { TEMPLATES_REGISTRY } from "@/lib/templates/registry";
import { syncPendingPayOSOrdersForUser } from "@/lib/payments/payos";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    await syncPendingPayOSOrdersForUser(user.id, { giftId: params.id });
    const inv = await prisma.invitation.findUnique({
      where: { id: params.id },
      include: {
        occasion: true,
        templateVersion: {
          include: { template: true },
        },
        revisions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
        shareLinks: true,
        rsvps: {
          orderBy: { createdAt: "desc" },
        },
        guestbook: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!inv) {
      return apiError("Không tìm thấy thiệp mời.", "NOT_FOUND", 404);
    }

    if (inv.ownerId !== user.id && !user.roles.includes("ADMIN")) {
      return apiError("Bạn không có quyền truy cập thiệp mời này.", "FORBIDDEN", 403);
    }

    const latestRevision = inv.revisions[0];
    const content = latestRevision ? JSON.parse(latestRevision.contentJson) : null;
    const templateMeta = TEMPLATES_REGISTRY[inv.templateVersion.template.slug];

    return apiSuccess({
      invitation: {
        id: inv.id,
        slug: inv.slug,
        title: inv.title,
        status: inv.status,
        privacyMode: inv.privacyMode,
        hasPasscode: !!inv.passcodeHash,
        publishedAt: inv.publishedAt,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt,
        occasion: inv.occasion,
        template: {
          slug: inv.templateVersion.template.slug,
          title: inv.templateVersion.template.title,
          theme: templateMeta?.theme,
        },
        revision: latestRevision?.versionNumber || 1,
        content,
        shareLink: inv.shareLinks[0]?.shortCode || null,
        rsvps: inv.rsvps,
        guestbook: inv.guestbook,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

const updateInvitationSchema = z.object({
  expectedRevision: z.number().optional(),
  title: z.string().optional(),
  privacyMode: z.enum(["UNLISTED", "PASSWORD", "PUBLIC", "ARCHIVED"]).optional(),
  passcode: z.string().optional(),
  content: InvitationContentSchema.optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const json = await req.json();
    const data = updateInvitationSchema.parse(json);

    const inv = await prisma.invitation.findUnique({
      where: { id: params.id },
      include: {
        revisions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    });

    if (!inv) {
      return apiError("Không tìm thấy thiệp mời.", "NOT_FOUND", 404);
    }

    if (inv.ownerId !== user.id && !user.roles.includes("ADMIN")) {
      return apiError("Bạn không có quyền chỉnh sửa thiệp mời này.", "FORBIDDEN", 403);
    }

    const currentRevNumber = inv.revisions[0]?.versionNumber || 1;

    // Optimistic concurrency check
    if (data.expectedRevision && data.expectedRevision !== currentRevNumber) {
      return apiError(
        "Dữ liệu đã được chỉnh sửa ở một phiên khác. Vui lòng tải lại trang.",
        "CONCURRENCY_CONFLICT",
        409
      );
    }

    const nextRevNumber = currentRevNumber + 1;
    let passcodeHash = inv.passcodeHash;
    if (data.passcode !== undefined) {
      passcodeHash = data.passcode ? await bcrypt.hash(data.passcode, 10) : null;
    }

    const updated = await prisma.$transaction(async (tx) => {
      let rev = null;
      if (data.content) {
        rev = await tx.invitationRevision.create({
          data: {
            invitationId: inv.id,
            versionNumber: nextRevNumber,
            contentJson: JSON.stringify(data.content),
            createdBy: user.id,
          },
        });
      }

      const updatedInv = await tx.invitation.update({
        where: { id: inv.id },
        data: {
          title: data.title !== undefined ? data.title : inv.title,
          privacyMode: data.privacyMode !== undefined ? data.privacyMode : inv.privacyMode,
          passcodeHash,
          currentRevisionId: rev ? rev.id : inv.currentRevisionId,
        },
      });

      return { updatedInv, revNumber: rev ? nextRevNumber : currentRevNumber };
    });

    return apiSuccess({
      id: updated.updatedInv.id,
      revision: updated.revNumber,
      saveStatus: "SAVED",
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const inv = await prisma.invitation.findUnique({ where: { id: params.id } });

    if (!inv) {
      return apiError("Không tìm thấy thiệp mời.", "NOT_FOUND", 404);
    }

    if (inv.ownerId !== user.id && !user.roles.includes("ADMIN")) {
      return apiError("Bạn không có quyền xóa thiệp mời này.", "FORBIDDEN", 403);
    }

    await prisma.invitation.delete({ where: { id: params.id } });

    await logAudit({
      actorId: user.id,
      actorRole: user.roles[0],
      action: "INVITATION_DELETED",
      resourceType: "Invitation",
      resourceId: params.id,
    });

    return apiSuccess({ message: "Đã xóa thiệp mời thành công." });
  } catch (err) {
    return handleApiError(err);
  }
}

