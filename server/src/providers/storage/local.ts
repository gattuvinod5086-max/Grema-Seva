import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { StoredFile, StorageProvider } from "./types";

const UPLOAD_DIR = path.resolve("uploads");

/**
 * Local-disk storage behind the StorageProvider interface so an
 * S3-compatible provider can replace it without touching call sites.
 * Keys are opaque UUIDs; user-supplied names never reach the filesystem.
 */
export class LocalStorageProvider implements StorageProvider {
  async save(data: Buffer, mime: string): Promise<StoredFile> {
    const ext = extFromMime(mime);
    const key = `${randomUUID()}${ext}`;
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(path.join(UPLOAD_DIR, key), data);
    return { key, mime, bytes: data.length };
  }

  async read(key: string): Promise<Buffer> {
    if (!/^[a-f0-9-]{36}(\.\w+)?$/.test(key)) {
      throw new Error("Invalid storage key");
    }
    return readFile(path.join(UPLOAD_DIR, key));
  }
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "audio/webm": ".weba",
    "audio/mpeg": ".mp3",
    "audio/mp4": ".m4a",
  };
  return map[mime] ?? "";
}
