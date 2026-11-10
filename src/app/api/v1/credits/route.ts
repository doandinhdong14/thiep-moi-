import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, handleApiError } from "@/lib/api/response";

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

