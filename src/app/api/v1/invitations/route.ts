import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";
import { generateUniqueSlug, generateShortCode } from "@/lib/utils/slug";
import { getTemplateDemoContent, DEFAULT_TEMPLATE_SLUG } from "@/lib/templates/registry";

const createInvitationSchema = z.object({
  occasionSlug: z.string().optional(),
  occasionKey: z.string().optional(),
  templateSlug: z.string().default(DEFAULT_TEMPLATE_SLUG),
  title: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const json = await req.json();
    const data = createInvitationSchema.parse(json);

    // Find template and its active version
    const template = await prisma.template.findUnique({
      where: { slug: data.templateSlug },
      include: {
        versions: {
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    if (!template || template.versions.length === 0) {
      return apiError("Mẫu thiệp không tồn tại hoặc chưa sẵn sàng.", "TEMPLATE_NOT_FOUND", 404);
    }

    const templateVersion = template.versions[0];

    // Find occasion
    let occasion = null;
    if (data.occasionSlug) {
      occasion = await prisma.occasion.findUnique({ where: { slug: data.occasionSlug } });
    }
    if (!occasion && data.occasionKey) {
      occasion = await prisma.occasion.findFirst({ where: { formPresetKey: data.occasionKey } });
    }
    if (!occasion && template.occasionId) {
      occasion = await prisma.occasion.findUnique({ where: { id: template.occasionId } });
    }
    if (!occasion) {
      occasion = await prisma.occasion.findFirst();
    }
    if (!occasion) {
      return apiError("Không tìm thấy chủ đề phù hợp.", "OCCASION_NOT_FOUND", 404);
    }

    // Default content from template demo
    const defaultContent = getTemplateDemoContent(data.templateSlug);
    if (data.title) {
      defaultContent.title = data.title;
    }

    const initialTitle = data.title || defaultContent.title;
    const slug = generateUniqueSlug(initialTitle);
    const shortCode = generateShortCode();

    const invitation = await prisma.$transaction(async (tx) => {
      const inv = await tx.invitation.create({
        data: {
          ownerId: user.id,
          occasionId: occasion!.id,
          templateVersionId: templateVersion.id,
          slug,
          title: initialTitle,
          status: "DRAFT",
          privacyMode: "UNLISTED",
        },
      });

      const rev = await tx.invitationRevision.create({
        data: {
          invitationId: inv.id,
          versionNumber: 1,
          contentJson: JSON.stringify(defaultContent),
          createdBy: user.id,
        },
      });

      await tx.invitation.update({
        where: { id: inv.id },
        data: { currentRevisionId: rev.id },
      });

      await tx.shareLink.create({
        data: {
          invitationId: inv.id,
          shortCode,
          label: "DEFAULT_SHARE",
        },
      });

      return inv;
    });

    await logAudit({
      actorId: user.id,
      actorRole: user.roles[0],
      action: "INVITATION_CREATED",
      resourceType: "Invitation",
      resourceId: invitation.id,
      afterSummary: { title: invitation.title, slug: invitation.slug },
    });

    return apiSuccess(
      {
        id: invitation.id,
        status: invitation.status,
        slug: invitation.slug,
        editorUrl: `/editor/${invitation.id}`,
        revision: 1,
      },
      201
    );
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const invitations = await prisma.invitation.findMany({
      where: { ownerId: user.id },
      include: {
        occasion: true,
        templateVersion: {
          include: { template: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return apiSuccess({ invitations });
  } catch (err) {
    return handleApiError(err);
  }
}

