import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getShopActorFromRoles } from "@/lib/shop/auth";
import { getRecipientGiftLanding } from "@/lib/shop/gift-card";
import GiftRecipientClient from "@/components/shop/GiftRecipientClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Có một lời thương đang đợi bạn mở",
  description: "Mở tấm thiệp kỷ niệm đính kèm trong hộp quà.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function RecipientGiftPage({
  params,
  searchParams,
}: {
  params: { giftToken: string };
  searchParams?: { mode?: string };
}) {
  const wantsPreview = searchParams?.mode === "preview";
  let isAdminPreview = false;

  if (wantsPreview) {
    const user = await getCurrentUser();
    if (user && getShopActorFromRoles(user.roles).canManageShop) {
      isAdminPreview = true;
    }
  }

  // Strictly calls non-mutating landing getter (never sets firstOpenedAt on GET!)
  const initialPayload = await getRecipientGiftLanding(params.giftToken, {
    isAdminPreview,
  });

  return (
    <GiftRecipientClient
      giftToken={params.giftToken}
      initialPayload={initialPayload}
    />
  );
}

