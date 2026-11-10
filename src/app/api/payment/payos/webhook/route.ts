import { NextRequest, NextResponse } from "next/server";
import { processPayOSWebhookPayload } from "@/lib/payments/payos";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { success: false, error: "Empty request body" },
        { status: 400 }
      );
    }

    // PayOS confirm webhook ping verification
    if (body.webhookUrl || body.event === "confirm") {
      return NextResponse.json({
        success: true,
        message: "Webhook URL confirmed successfully",
      });
    }

    const result = await processPayOSWebhookPayload(body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[PayOS Webhook Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error processing PayOS webhook",
      },
      { status: 400 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "PayOS Webhook Endpoint",
    timestamp: new Date().toISOString(),
  });
}

