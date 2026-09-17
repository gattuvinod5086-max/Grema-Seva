import { S3Client, PutObjectCommand, GetObjectCommand, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { readFile } from "node:fs/promises";
import type { StoredFile, StorageProvider } from "./types";

const LOCAL_UPLOAD_DIR = path.resolve("uploads");

export interface SupabaseStorageConfig {
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
  region?: string;
  bucket?: string;
}

export class SupabaseStorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;
  private bucketChecked = false;

  constructor(config: SupabaseStorageConfig) {
    this.bucket = config.bucket || "grama-seva-uploads";
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region || "ap-south-1",
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  private async ensureBucket() {
    if (this.bucketChecked) return;
    try {
      await this.client.send(new HeadBucketCommand({ Bucket: this.bucket }));
      this.bucketChecked = true;
    } catch {
      try {
        await this.client.send(new CreateBucketCommand({ Bucket: this.bucket }));
        this.bucketChecked = true;
      } catch (createErr) {
        console.warn(`[storage:supabase] Bucket check/create note:`, createErr);
        // Assume bucket exists or permissions forbid Head/Create
        this.bucketChecked = true;
      }
    }
  }

  async save(data: Buffer, mime: string): Promise<StoredFile> {
    await this.ensureBucket();
    const ext = extFromMime(mime);
    const key = `${randomUUID()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: mime,
    });

    await this.client.send(command);
    return { key, mime, bytes: data.length };
  }

  async read(key: string): Promise<Buffer> {
    if (!/^[a-f0-9-]{36}(\.\w+)?$/.test(key)) {
      throw new Error("Invalid storage key");
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const res = await this.client.send(command);
      const byteArray = await res.Body?.transformToByteArray();
      if (!byteArray) throw new Error("Empty response from cloud storage");
      return Buffer.from(byteArray);
    } catch (err) {
      // Fallback to local uploads if previously stored on local disk
      try {
        return await readFile(path.join(LOCAL_UPLOAD_DIR, key));
      } catch {
        throw err;
      }
    }
  }
}

function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
    "image/gif": ".gif",
    "audio/webm": ".weba",
    "audio/mpeg": ".mp3",
    "audio/mp4": ".m4a",
  };
  return map[mime] ?? "";
}
