import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { QR_PRESETS } from "@/lib/qr/presets";

const QrTextSchema = z.object({
  id: z.string(),
  text: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number().optional(),
  rotation: z.number().default(0),
  fontFamily: z.string().default("sans-serif"),
  fontSize: z.number().default(36),
  color: z.string().default("#ffffff"),
  hasBackground: z.boolean().optional(),
  backgroundColor: z.string().optional(),
  align: z.enum(["left", "center", "right"]).default("center"),
  styleId: z.string().optional(),
  zIndex: z.number().default(1),
});

const QrIconSchema = z.object({
  id: z.string(),
  emoji: z.string(),
  assetId: z.string().optional(),
  x: z.number(),
  y: z.number(),
  size: z.number().default(48),
  rotation: z.number().default(0),
  zIndex: z.number().default(1),
});

const QrDesignSchema = z.object({
  presetId: z.string().default("gift-for-you"),
  moduleColor: z.string().default("#ff2a5f"),
  backgroundUrl: z.string().optional(),
  backgroundFit: z.enum(["cover", "contain"]).optional(),
  texts: z.array(QrTextSchema).default([]),
  icons: z.array(QrIconSchema).default([]),
  revision: z.number().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const inv = await prisma.invitation.findUnique({
      where: { id: params.id },
      include: { shareLinks: true },
    });

    if (!inv) {
      return apiError("Không tìm thấy thiệp.", "NOT_FOUND", 404);
    }

    let design = null;
    if (inv.qrDesignJson) {
      try {
        design = JSON.parse(inv.qrDesignJson);
      } catch {}
    }

    if (!design) {
      // Default to first preset cleanly with no obstructing overlays
      const preset = QR_PRESETS[0];
      design = {
        giftId: inv.id,
        presetId: preset.id,
        moduleColor: preset.defaultModuleColor,
        texts: [],
        icons: [],
        revision: 1,
      };
    }

    return apiSuccess({ qrDesign: design });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    const inv = await prisma.invitation.findUnique({
      where: { id: params.id },
    });

    if (!inv) {
      return apiError("Không tìm thấy thiệp.", "NOT_FOUND", 404);
    }

    if (user && inv.ownerId !== user.id && !user.roles.includes("ADMIN")) {
      return apiError("Bạn không có quyền chỉnh sửa QR thiệp này.", "FORBIDDEN", 403);
    }

    const body = await req.json();
    const parsed = QrDesignSchema.parse(body);

    let currentRev = 1;
    if (inv.qrDesignJson) {
      try {
        const old = JSON.parse(inv.qrDesignJson);
        currentRev = (old.revision || 1) + 1;
      } catch {}
    }

    const newDesign = {
      ...parsed,
      giftId: inv.id,
      revision: currentRev,
    };

    await prisma.invitation.update({
      where: { id: inv.id },
      data: {
        qrDesignJson: JSON.stringify(newDesign),
      },
    });

    return apiSuccess({
      qrDesign: newDesign,
      revision: currentRev,
      saveStatus: "SAVED",
    });
  } catch (err) {
    return handleApiError(err);
  }
}

