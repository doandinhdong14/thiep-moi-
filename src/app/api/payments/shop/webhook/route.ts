import { NextResponse } from "next/server";
import { handleShopPayOSWebhook } from "@/lib/shop/payment";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await handleShopPayOSWebhook(body);
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook verification failed";
    console.error("[Shop PayOS Webhook Error]:", msg);
    return NextResponse.json({ ok: false, message: msg }, { status: 400 });
  }
}

