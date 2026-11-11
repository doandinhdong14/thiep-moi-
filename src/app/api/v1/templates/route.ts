import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { getEffectiveVisibleTemplates } from "@/lib/templates/adminConfig";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const occasionKey = searchParams.get("occasion");
    const isPremium = searchParams.get("premium");

    let templates = await getEffectiveVisibleTemplates();

    if (occasionKey && occasionKey !== "all") {
      templates = templates.filter((t) => t.occasionKey === occasionKey);
    }

    if (isPremium === "true") {
      templates = templates.filter((t) => t.isPremium);
    } else if (isPremium === "false") {
      templates = templates.filter((t) => !t.isPremium);
    }

    // Try merging with DB template flags if seeded
    const dbTemplates = await prisma.template
      .findMany({
        select: { slug: true, isPremium: true, sortOrder: true },
      })
      .catch(() => []);

    const dbMap = new Map(dbTemplates.map((item) => [item.slug, item]));

    return apiSuccess({
      templates: templates.map((t) => ({
        ...t,
        isPremium: dbMap.get(t.slug)?.isPremium ?? t.isPremium,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
