import type { StorageProvider } from "./types";
import { LocalStorageProvider } from "./local";

export type { StorageProvider, StoredFile } from "./types";

let provider: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  // Single provider for the POC; swap here for S3/MinIO later.
  provider ??= new LocalStorageProvider();
  return provider;
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export const ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "audio/webm",
  "audio/mpeg",
  "audio/mp4",
];
