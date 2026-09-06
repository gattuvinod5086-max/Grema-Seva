import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "../env";

/**
 * Supabase connects over a pooler; postgres.js in transaction mode would
 * break prepared statements, so we run with prepare disabled.
 */
const client = postgres(env.DATABASE_URL, {
  prepare: false,
  max: 10,
  idle_timeout: 30,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
export type Database = typeof db;
export { client, schema };
