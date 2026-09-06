import { defineConfig } from "drizzle-kit";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  console.error("[drizzle] DATABASE_URL is required (.env)");
  process.exit(1);
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./server/src/db/schema/index.ts",
  out: "./server/src/db/migrations",
  dbCredentials: { url: process.env.DATABASE_URL },
  strict: true,
  verbose: true,
});
