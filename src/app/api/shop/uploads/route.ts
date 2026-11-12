import sharp from "sharp";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getStorage } from "@/lib/storage";
import { getOrCreateShopGuestToken, setShopGuestCookieOnResponse } from "@/lib/shop/auth";
import { handleShopApiError } from "@/lib/shop/api-helpers";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const { token: guestToken, isNew } = getOrCreateShopGuestToken();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return apiError("Vui lòng chọn tệp ảnh.", "MISSING_FILE", 400);
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return apiError("Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.", "INVALID_FILE_TYPE", 400);
    }
    if (file.size > MAX_FILE_BYTES || file.size <= 0) {
      return apiError("Dung lượng ảnh phải dưới 5MB.", "FILE_TOO_LARGE", 400);
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer());
    // Re-encode through sharp to strip EXIF & guarantee safe raster payload
    let cleanWebpBuffer: Buffer;
    let width = 0;
    let height = 0;
    try {
      const pipeline = sharp(rawBuffer).rotate().resize(1600, 1600, {
        fit: "inside",
        withoutEnlargement: true,
      });
      const out = await pipeline.webp({ quality: 84 }).toBuffer({ resolveWithObject: true });
      cleanWebpBuffer = out.data;
      width = out.info.width;
      height = out.info.height;
    } catch {
      return apiError("Tệp ảnh không hợp lệ hoặc bị hỏng.", "CORRUPT_IMAGE", 400);
    }

    const storage = getStorage();
    const saved = await storage.save(cleanWebpBuffer, "shop-photo.webp", "image/webp");

    // Persist blob in SystemSetting for container restarts cleanly
    await prisma.systemSetting.upsert({
      where: { key: `asset_blob:${saved.storageKey}` },
      update: {
        valueJson: JSON.stringify({
          mimeType: "image/webp",
          dataBase64: cleanWebpBuffer.toString("base64"),
        }),
        updatedBy: user?.id || `guest:${guestToken.slice(0, 8)}`,
      },
      create: {
        key: `asset_blob:${saved.storageKey}`,
        valueJson: JSON.stringify({
          mimeType: "image/webp",
          dataBase64: cleanWebpBuffer.toString("base64"),
        }),
        updatedBy: user?.id || `guest:${guestToken.slice(0, 8)}`,
      },
    });

    const res = apiSuccess(
      {
        publicUrl: saved.publicUrl,
        width,
        height,
        byteSize: saved.byteSize,
      },
      201,
    );
    if (!user && isNew) {
      setShopGuestCookieOnResponse(res, guestToken);
    }
    return res;
  } catch (err) {
    return handleShopApiError(err);
  }
}

