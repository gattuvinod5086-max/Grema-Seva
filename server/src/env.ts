import { z } from "zod";

const boolFromEnv = z
  .enum(["true", "false"])
  .default("false")
  .transform((v) => v === "true");

const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  SESSION_SECRET: z
    .string()
    .min(32, "SESSION_SECRET must be at least 32 chars (openssl rand -hex 32)"),
  APP_BASE_URL: z.string().url().default("http://localhost:5173"),
  PORT: z.coerce.number().int().positive().default(3000),

  /** OTP/IP throttles — enable in production (cost + abuse protection). */
  RATE_LIMITS_ENABLED: boolFromEnv,

  SMS_DRIVER: z.enum(["console", "msg91"]).default("console"),
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_OTP_TEMPLATE_ID: z.string().optional(),
  MSG91_SENDER_ID: z.string().optional(),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  SUPER_ADMIN_PHONE: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/, "SUPER_ADMIN_PHONE must be in E.164 format")
    .default("+919999999999"),

  // Supabase Cloud Storage (S3-compatible)
  SUPBASE_S3_URL: z.string().optional(),
  SUPABASE_S3_URL: z.string().optional(),
  SUPBASE_ACCESS_KEY: z.string().optional(),
  SUPABASE_ACCESS_KEY: z.string().optional(),
  SUPBASE_SECRET_KEY: z.string().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
  SUPBASE_REGION: z.string().optional(),
  SUPABASE_REGION: z.string().optional(),
  SUPBASE_BUCKET: z.string().optional(),
  SUPABASE_BUCKET: z.string().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("[env] Invalid environment configuration:");
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;

export const isGoogleOAuthConfigured = () =>
  Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

export const isSupabaseStorageConfigured = () =>
  Boolean(
    (env.SUPBASE_S3_URL || env.SUPABASE_S3_URL) &&
    (env.SUPBASE_ACCESS_KEY || env.SUPABASE_ACCESS_KEY) &&
    (env.SUPBASE_SECRET_KEY || env.SUPABASE_SECRET_KEY)
  );
