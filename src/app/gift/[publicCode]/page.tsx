import React from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Gift, Sparkles, ExternalLink, KeyRound, AlertCircle } from "lucide-react";

interface GiftCardScanPageProps {
  params: {
    publicCode: string;
  };
}

export default async function GiftCardScanPage({ params }: GiftCardScanPageProps) {
  const publicCode = params.publicCode.toUpperCase();

  const card = await prisma.giftCard.findUnique({
    where: { publicCode },
    include: {
      bindings: {
        where: { active: true },
        include: {
          invitation: {
            select: {
              id: true,
              title: true,
              slug: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!card) {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">Thẻ không tồn tại</h1>
          <p className="text-neutral-600 text-sm mb-6">
            Mã thẻ quà tặng <span className="font-mono font-semibold">{publicCode}</span> không tồn tại trong hệ thống.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition"
          >
            Về trang chủ
          </Link>
        </div>
      </main>
    );
  }

  // Increment scan stats
  const today = new Date().toISOString().split("T")[0];
  try {
    await prisma.giftCardScanDaily.upsert({
      where: {
        giftCardId_dayUTC: {
          giftCardId: card.id,
          dayUTC: today,
        },
      },
      update: {
        scans: { increment: 1 },
      },
      create: {
        giftCardId: card.id,
        dayUTC: today,
        scans: 1,
      },
    });
  } catch (e) {
    // Non-blocking scan counter
  }

  // State: REVOKED
  if (card.status === "REVOKED") {
    return (
      <main className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Gift className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">Thẻ đã hết hiệu lực</h1>
          <p className="text-neutral-600 text-sm mb-6">
            Thẻ quà tặng này đã hết hạn hoặc không còn hiệu lực. Vui lòng liên hệ người tặng để biết thêm chi tiết.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 bg-neutral-900 text-white text-sm font-medium rounded-xl hover:bg-neutral-800 transition"
          >
            Về trang chủ
          </Link>
        </div>
      </main>
    );
  }

  // State: UNCLAIMED / INACTIVE (Món quà sắp mở)
  if (card.status !== "ACTIVE" || !card.bindings[0]?.invitation) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-neutral-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-md border border-neutral-200 p-8 text-center">
          <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-5 animate-pulse">
            <Gift className="w-10 h-10" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Món quà sắp mở
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">Thẻ QR vật lý Ding Dong Gift</h1>
          <p className="text-neutral-600 text-sm mb-6 leading-relaxed">
            Thẻ quà tặng này hiện chưa được kích hoạt liên kết với thiệp mời kỹ thuật số. Nếu bạn là chủ sở hữu tấm thiệp, hãy cào mã bí mật ở mặt sau và kích hoạt ngay.
          </p>

          <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 text-left mb-6">
            <div className="text-xs text-neutral-500 uppercase tracking-wider font-semibold mb-1">Mã thẻ quà tặng</div>
            <div className="font-mono text-base font-bold text-neutral-800">{card.publicCode}</div>
          </div>

          <Link
            href={`/activate/${card.publicCode}`}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl shadow transition"
          >
            <KeyRound className="w-4 h-4" />
            Kích hoạt thẻ ngay
          </Link>
        </div>
      </main>
    );
  }

  // State: ACTIVE & BOUND -> Show greeting and direct to invitation
  const invitation = card.bindings[0].invitation;

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 via-rose-50 to-neutral-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-rose-100 p-8 text-center relative overflow-hidden">
        <div className="w-24 h-24 bg-gradient-to-tr from-rose-500 to-pink-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-200">
          <Gift className="w-12 h-12" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          Món quà dành riêng cho bạn
        </div>

        <h1 className="text-2xl font-extrabold text-neutral-900 mb-2">
          {invitation.title}
        </h1>

        <p className="text-neutral-600 text-sm mb-8 leading-relaxed">
          Tấm thiệp đặc biệt cùng lời nhắn gửi yêu thương đã sẵn sàng để bạn khám phá.
        </p>

        <Link
          href={`/i/${invitation.slug}`}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 text-white font-semibold rounded-2xl shadow-lg transition transform active:scale-95"
        >
          <span>Mở thiệp mời ngay</span>
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>
    </main>
  );
}
