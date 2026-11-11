import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { syncPendingPayOSOrdersForUser } from "@/lib/payments/payos";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiSuccess({
        balance: {
          imageUploads: 0,
          audioUploads: 0,
          revision: 1,
        },
      });
    }

    await syncPendingPayOSOrdersForUser(user.id);

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { imageCredits: true, audioCredits: true },
    });

    return apiSuccess({
      balance: {
        imageUploads: dbUser?.imageCredits || 0,
        audioUploads: dbUser?.audioCredits || 0,
        revision: 1,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

