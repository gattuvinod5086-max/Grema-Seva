import postgres from "postgres";

/**
 * Isolation contract suite environment.
 * These MUST be set before any server module is imported: env.ts
 * validates process.env at import time.
 */
process.env.DATABASE_URL ??= "postgresql://postgres:gramseva@localhost:54322/gramseva_test";
process.env.SESSION_SECRET ??= "test-secret-test-secret-test-secret-00";
process.env.SMS_DRIVER ??= "console";
process.env.APP_BASE_URL ??= "http://localhost:5173";
process.env.PORT ??= "3999";
process.env.SUPER_ADMIN_PHONE ??= "+919999999999";

export const testSql = postgres(process.env.DATABASE_URL, { prepare: false });
