import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { generateQrPng, generateQrSvg } from "@/lib/qr";
import { generateShortCode } from "@/lib/utils/slug";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invId = params.id;
    const inv = await prisma.invitation.findUnique({
      where: { id: invId },
      include: {
        shareLinks: true,
      },
    });

    if (!inv) {
      return new NextResponse("Invitation not found", { status: 404 });
    }

    // Access check: owner or admin can always access. Public can access if published.
    const user = await getCurrentUser();
    const isOwner = user && user.id === inv.ownerId;
    const isAdmin = user && user.roles.includes("ADMIN");

    if (!isOwner && !isAdmin) {
      if (inv.status !== "PUBLISHED") {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    // Ensure an active ShareLink exists
    let shareLink = inv.shareLinks.find((l) => l.status === "ACTIVE");
    if (!shareLink) {
      const shortCode = generateShortCode();
      shareLink = await prisma.shareLink.create({
        data: {
          invitationId: inv.id,
          shortCode,
          label: "DEFAULT_SHARE",
        },
      });
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const targetUrl = `${protocol}://${host}/q/${shareLink.shortCode}`;

    const url = new URL(req.url);
    const format = (url.searchParams.get("format") || "png").toLowerCase();
    const sizeParam = parseInt(url.searchParams.get("size") || "512", 10);
    const size = Math.min(Math.max(isNaN(sizeParam) ? 512 : sizeParam, 128), 2048);
    const download = url.searchParams.get("download") === "true";

    const filename = `dingdonggift-${inv.slug}-qr.${format === "svg" ? "svg" : "png"}`;
    const disposition = download
      ? `attachment; filename="${filename}"`
      : `inline; filename="${filename}"`;

    if (format === "svg") {
      const svgString = await generateQrSvg(targetUrl);
      return new NextResponse(svgString, {
        status: 200,
        headers: {
          "Content-Type": "image/svg+xml; charset=utf-8",
          "Content-Disposition": disposition,
          "Cache-Control": "public, max-age=3600",
        },
      });
    } else {
      const pngBuffer = await generateQrPng(targetUrl, { width: size });
      return new NextResponse(new Uint8Array(pngBuffer), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Disposition": disposition,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  } catch (err) {
    console.error("Error generating QR:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
