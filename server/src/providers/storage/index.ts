import type { StorageProvider } from "./types";
import { LocalStorageProvider } from "./local";
import { SupabaseStorageProvider } from "./supabase";
import { env, isSupabaseStorageConfigured } from "../../env";

export type { StorageProvider, StoredFile } from "./types";

let provider: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (!provider) {
    if (isSupabaseStorageConfigured()) {
      const endpoint = (env.SUPBASE_S3_URL || env.SUPABASE_S3_URL)!;
      const accessKeyId = (env.SUPBASE_ACCESS_KEY || env.SUPABASE_ACCESS_KEY)!;
      const secretAccessKey = (env.SUPBASE_SECRET_KEY || env.SUPABASE_SECRET_KEY)!;
      const region = env.SUPBASE_REGION || env.SUPABASE_REGION || "ap-south-1";
      const bucket = env.SUPBASE_BUCKET || env.SUPABASE_BUCKET || "grama-seva-uploads";

      console.log(`[storage] Using Supabase Cloud Storage (bucket: ${bucket}, region: ${region})`);
      provider = new SupabaseStorageProvider({
        endpoint,
        accessKeyId,
        secretAccessKey,
        region,
        bucket,
      });
    } else {
      console.log("[storage] Using Local Storage fallback");
      provider = new LocalStorageProvider();
    }
  }
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
