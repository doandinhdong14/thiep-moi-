import { getCurrentUser } from "@/lib/auth/session";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return apiError("Chưa đăng nhập", "UNAUTHORIZED", 401);
  }

  return apiSuccess({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      status: user.status,
      locale: user.locale,
      imageCredits: user.imageCredits,
      audioCredits: user.audioCredits,
      createdAt: user.createdAt,
      roles: user.roles,
    },
  });
}

