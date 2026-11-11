import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser, createSession } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";
import { generateUniqueSlug, generateShortCode } from "@/lib/utils/slug";
import { getTemplateDemoContent, DEFAULT_TEMPLATE_SLUG } from "@/lib/templates/registry";

const DraftSchema = z.object({
  templateSlug: z.string().default(DEFAULT_TEMPLATE_SLUG),
  forceNew: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    let user = await getCurrentUser();

    // If no user session, bootstrap an active guest user
    if (!user) {
      const guestEmail = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@dingdonggift.vn`;
      const newUser = await prisma.user.create({
        data: {
          email: guestEmail,
          name: "Khách",
          status: "ACTIVE",
        },
      });
      await createSession(newUser.id, req.headers.get("user-agent") || undefined);
      user = {
        ...newUser,
        roles: [],
      };
    }

    const body = await req.json().catch(() => ({}));
    const { templateSlug, forceNew } = DraftSchema.parse(body);

    const template = await prisma.template.findUnique({
      where: { slug: templateSlug },
      include: {
        versions: {
          orderBy: { version: "desc" },
          take: 1,
        },
      },
    });

    if (!template || template.versions.length === 0) {
      return apiError("Mẫu thiệp không tồn tại.", "TEMPLATE_NOT_FOUND", 404);
    }

    const templateVersion = template.versions[0];

    // Check for recent draft if not forceNew
    if (!forceNew) {
      const existingDraft = await prisma.invitation.findFirst({
        where: {
          ownerId: user.id,
          templateVersionId: templateVersion.id,
          status: "DRAFT",
        },
        orderBy: { updatedAt: "desc" },
      });

      if (existingDraft) {
        return apiSuccess({
          id: existingDraft.id,
          slug: existingDraft.slug,
          isExisting: true,
          editorUrl: `/editor/${existingDraft.id}?step=content`,
        });
      }
    }

    // Default content from template demo
    const defaultContent = getTemplateDemoContent(templateSlug);
    const initialTitle = defaultContent.title;
    const slug = generateUniqueSlug(initialTitle);
    const shortCode = generateShortCode();

    const occasion = (await prisma.occasion.findFirst()) || { id: "default_occ" };

    const invitation = await prisma.$transaction(async (tx) => {
      const inv = await tx.invitation.create({
        data: {
          ownerId: user!.id,
          occasionId: template.occasionId || occasion.id,
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
          createdBy: user!.id,
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
      action: "DRAFT_CREATED",
      resourceType: "Invitation",
      resourceId: invitation.id,
      afterSummary: { title: invitation.title, slug: invitation.slug },
    });

    return apiSuccess({
      id: invitation.id,
      slug: invitation.slug,
      isExisting: false,
      editorUrl: `/editor/${invitation.id}?step=content`,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

