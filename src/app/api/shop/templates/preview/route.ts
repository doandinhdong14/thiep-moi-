import { z } from "zod";
import { apiSuccess } from "@/lib/api/response";
import { handleShopApiError } from "@/lib/shop/api-helpers";
import {
  buildGiftInvitationContent,
  hydrateShopCardHtml,
} from "@/lib/shop/gift-card";

const PreviewSchema = z.object({
  templateSlug: z.string().min(1).max(60),
  recipientName: z.string().max(80).optional(),
  senderName: z.string().max(80).optional(),
  title: z.string().max(120).optional(),
  message: z.string().max(2000).optional(),
  occasion: z.string().max(60).optional(),
  musicTrackId: z.string().max(120).optional(),
  photoUrls: z.array(z.string().max(500)).max(6).optional(),
});

export async function POST(req: Request) {
  try {
    const body = PreviewSchema.parse(await req.json());
    const { templateMeta, content } = buildGiftInvitationContent({
      templateSlug: body.templateSlug,
      recipientName: body.recipientName || "Bạn thương",
      senderName: body.senderName || "Người gửi",
      title: body.title,
      message: body.message || "",
      occasion: body.occasion,
      musicTrackId: body.musicTrackId,
      photoUrls: body.photoUrls || [],
    });

    const { interactiveHtml } = hydrateShopCardHtml({
      templateSlug: templateMeta.slug,
      content,
      isPreview: true,
    });

    return apiSuccess({
      templateSlug: templateMeta.slug,
      templateTitle: templateMeta.title,
      theme: templateMeta.theme,
      content,
      interactiveHtml: interactiveHtml || null,
    });
  } catch (err) {
    return handleShopApiError(err);
  }
}

