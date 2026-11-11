import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth/session";
import { getStorage } from "@/lib/storage";
import { apiSuccess, apiError, handleApiError } from "@/lib/api/response";
import { logAudit } from "@/lib/audit";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

const EXT_TO_MIME: Record<string, string> = {
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

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/ogg",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/aac",
  "audio/webm",
  "audio/flac",
  "video/mp4",
]);

function resolveMimeType(file: File): string {
  const raw = (file.type || "").toLowerCase().trim();
  if (ALLOWED_MIME_TYPES.has(raw)) {
    return raw === "image/jpg" ? "image/jpeg" : raw;
  }
  const dotIdx = file.name.lastIndexOf(".");
  if (dotIdx !== -1) {
    const ext = file.name.slice(dotIdx).toLowerCase();
    if (EXT_TO_MIME[ext]) return EXT_TO_MIME[ext];
  }
  return raw;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const invitationId = formData.get("invitationId") as string | null;

    if (!file) {
      return apiError("Vui lòng chọn tệp tin tải lên.", "NO_FILE", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return apiError("Kích thước tệp tin vượt quá 20MB cho phép.", "FILE_TOO_LARGE", 413);
    }

    const mimeType = resolveMimeType(file);
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return apiError(`Định dạng tệp không được hỗ trợ: ${file.type || file.name}`, "INVALID_MIME_TYPE", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storage = getStorage();
    const result = await storage.save(buffer, file.name, mimeType);

    // Persist file content in DB so uploads survive ephemeral container restarts on Railway
    await prisma.systemSetting.upsert({
      where: { key: `asset_blob:${result.storageKey}` },
      create: {
        key: `asset_blob:${result.storageKey}`,
        valueJson: JSON.stringify({
          mimeType: result.mimeType,
          dataBase64: buffer.toString("base64"),
        }),
      },
      update: {
        valueJson: JSON.stringify({
          mimeType: result.mimeType,
          dataBase64: buffer.toString("base64"),
        }),
      },
    });

    const asset = await prisma.asset.create({
      data: {
        uploaderId: user.id,
        storageKey: result.storageKey,
        mimeType: result.mimeType,
        byteSize: result.byteSize,
        visibility: "PUBLIC",
      },
    });

    if (invitationId) {
      await prisma.invitationAsset.create({
        data: {
          invitationId,
          assetId: asset.id,
          usage: "GALLERY",
        },
      }).catch(() => {});
    }

    await logAudit({
      actorId: user.id,
      actorRole: user.roles[0],
      action: "ASSET_UPLOADED",
      resourceType: "Asset",
      resourceId: asset.id,
      afterSummary: { mimeType: asset.mimeType, byteSize: asset.byteSize },
    });

    return apiSuccess({
      assetId: asset.id,
      url: result.publicUrl,
      storageKey: result.storageKey,
      byteSize: result.byteSize,
      mimeType: result.mimeType,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

