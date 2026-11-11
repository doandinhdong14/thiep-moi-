import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface StorageResult {
  storageKey: string;
  publicUrl: string;
  byteSize: number;
  mimeType: string;
}

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

export interface StorageAdapter {
  save(buffer: Buffer, originalName: string, mimeType: string): Promise<StorageResult>;
  get(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
}

export class LocalStorageAdapter implements StorageAdapter {
  private uploadDir: string;

  constructor(relativeUploadDir = "./public/uploads") {
    this.uploadDir = path.resolve(process.cwd(), relativeUploadDir);
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async save(buffer: Buffer, originalName: string, mimeType: string): Promise<StorageResult> {
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new Error(`Định dạng tệp không được hỗ trợ: ${mimeType}`);
    }

    const ext = path.extname(originalName) || ".bin";
    const randomName = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(this.uploadDir, randomName);

    await fs.promises.writeFile(filePath, buffer);

    return {
      storageKey: randomName,
      publicUrl: `/uploads/${randomName}`,
      byteSize: buffer.length,
      mimeType,
    };
  }

  async get(storageKey: string): Promise<Buffer> {
    const safeKey = path.basename(storageKey);
    const filePath = path.join(this.uploadDir, safeKey);
    if (!fs.existsSync(filePath)) {
      throw new Error("Không tìm thấy tệp tin.");
    }
    return fs.promises.readFile(filePath);
  }

  async delete(storageKey: string): Promise<void> {
    const safeKey = path.basename(storageKey);
    const filePath = path.join(this.uploadDir, safeKey);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
}

// Singleton storage instance
let storageInstance: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (!storageInstance) {
    storageInstance = new LocalStorageAdapter();
  }
  return storageInstance;
}

