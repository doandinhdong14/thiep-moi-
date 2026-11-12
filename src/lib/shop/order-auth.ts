import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getShopActorFromRoles,
  hashOrderAccessToken,
  readOrderAccessCookieMap,
} from "./auth";

export async function authorizeOrderForRequest(req: Request, orderCode: string) {
  const user = await getCurrentUser();
  const url = new URL(req.url);
  const queryToken = url.searchParams.get("token") || req.headers.get("x-shop-order-token");
  const cookieMap = readOrderAccessCookieMap();
  const cookieToken = cookieMap[orderCode.toUpperCase()];

  const order = await prisma.storeOrder.findUnique({
    where: { orderCode: orderCode.toUpperCase() },
    include: {
      items: true,
      giftUnits: {
        orderBy: { unitIndex: "asc" },
        include: { customization: true },
      },
      shipments: { orderBy: { createdAt: "desc" } },
      payments: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!order) {
    return { order: null, authorized: false, providedQueryToken: null, user };
  }

  const isStaff = user ? getShopActorFromRoles(user.roles).canManageShop : false;
  const isOwner = Boolean(user && order.userId === user.id);
  const queryMatches = Boolean(
    queryToken &&
      order.guestAccessTokenHash &&
      hashOrderAccessToken(queryToken) === order.guestAccessTokenHash,
  );
  const cookieMatches = Boolean(
    cookieToken &&
      order.guestAccessTokenHash &&
      hashOrderAccessToken(cookieToken) === order.guestAccessTokenHash,
  );

  return {
    order,
    authorized: isStaff || isOwner || queryMatches || cookieMatches,
    providedQueryToken: queryMatches ? queryToken : null,
    user,
  };
}

