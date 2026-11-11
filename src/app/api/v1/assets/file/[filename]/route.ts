import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const EXT_MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".pdf": "application/pdf",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".flac": "audio/flac",
  ".webm": "audio/webm",
  ".mp4": "video/mp4",
};

function inferMimeType(filename: string, fallback?: string): string {
  const ext = path.extname(filename).toLowerCase();
  return EXT_MIME_MAP[ext] || fallback || "application/octet-stream";
}

export async function GET(
  req: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const safeKey = path.basename(params.filename || "");
    if (!safeKey || safeKey === "." || safeKey === "..") {
      return new NextResponse("Not Found", { status: 404 });
    }

    const uploadDir = path.resolve(process.cwd(), "public", "uploads");
    const diskPath = path.join(uploadDir, safeKey);

    let buffer: Buffer | null = null;
    let mimeType = inferMimeType(safeKey);

    if (fs.existsSync(diskPath)) {
      buffer = await fs.promises.readFile(diskPath);
    } else {
      const stored = await prisma.systemSetting.findUnique({
        where: { key: `asset_blob:${safeKey}` },
      });
      if (stored?.valueJson) {
        const parsed = JSON.parse(stored.valueJson) as {
          mimeType?: string;
          dataBase64?: string;
        };
        if (parsed.dataBase64) {
          buffer = Buffer.from(parsed.dataBase64, "base64");
          mimeType = parsed.mimeType || mimeType;
          fs.mkdirSync(uploadDir, { recursive: true });
          await fs.promises.writeFile(diskPath, buffer).catch(() => {});
        }
      }
    }

    if (!buffer) {
      return new NextResponse("Not Found", { status: 404 });
    }

    if (mimeType === "application/octet-stream") {
      const asset = await prisma.asset.findUnique({
        where: { storageKey: safeKey },
        select: { mimeType: true },
      });
      if (asset?.mimeType) {
        mimeType = asset.mimeType;
      }
    }

    const totalLength = buffer.length;
    const rangeHeader = req.headers.get("range");

    if (rangeHeader) {
      const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
      if (match) {
        const start = match[1] ? parseInt(match[1], 10) : 0;
        const end = match[2] ? Math.min(parseInt(match[2], 10), totalLength - 1) : totalLength - 1;

        if (!Number.isNaN(start) && !Number.isNaN(end) && start <= end && start < totalLength) {
          const chunk = buffer.subarray(start, end + 1);
          return new NextResponse(new Uint8Array(chunk), {
            status: 206,
            headers: {
              "Content-Type": mimeType,
              "Content-Length": String(chunk.length),
              "Content-Range": `bytes ${start}-${end}/${totalLength}`,
              "Accept-Ranges": "bytes",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }
      }
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(totalLength),
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

