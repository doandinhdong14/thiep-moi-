import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { getStorage } from "@/lib/storage";

export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const job = await prisma.exportJob.findUnique({
      where: { id: params.jobId },
      include: {
        invitation: true,
      },
    });

    if (!job) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const user = await getCurrentUser();
    const isRequester = user && user.id === job.requesterId;
    const isOwner = user && user.id === job.invitation.ownerId;
    const isAdmin = user && user.roles.includes("ADMIN");
    const isPublished = job.invitation.status === "PUBLISHED";

    if (!isRequester && !isOwner && !isAdmin && !isPublished) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (job.status !== "SUCCEEDED" || !job.storageKey) {
      return new NextResponse("File is not ready or export failed", { status: 400 });
    }

    const storage = getStorage();
    const fileBuffer = await storage.get(job.storageKey);

    let mimeType = "application/octet-stream";
    let ext = "bin";
    if (job.format === "PDF") {
      mimeType = "application/pdf";
      ext = "pdf";
    } else if (job.format === "PNG") {
      mimeType = "image/png";
      ext = "png";
    } else if (job.format === "JPG") {
      mimeType = "image/jpeg";
      ext = "jpg";
    }

    const filename = `dingdonggift-${job.invitation.slug}-${job.format.toLowerCase()}.${ext}`;

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": fileBuffer.length.toString(),
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Download export error:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
