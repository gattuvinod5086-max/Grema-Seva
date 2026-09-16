import { and, eq } from "drizzle-orm";
import { db, schema } from "../db/client";
import type { Jurisdiction } from "../db/schema";

export async function findJurisdictionByName(
  district: string,
  mandal: string,
  village: string
): Promise<Jurisdiction | null> {
  const [j] = await db
    .select()
    .from(schema.jurisdictions)
    .where(
      and(
        eq(schema.jurisdictions.district, district),
        eq(schema.jurisdictions.mandal, mandal),
        eq(schema.jurisdictions.village, village)
      )
    )
    .limit(1);
  return j ?? null;
}

export async function findFirstJurisdictionByMandal(
  district: string,
  mandal: string
): Promise<Jurisdiction | null> {
  const [j] = await db
    .select()
    .from(schema.jurisdictions)
    .where(
      and(
        eq(schema.jurisdictions.district, district),
        eq(schema.jurisdictions.mandal, mandal)
      )
    )
    .limit(1);
  return j ?? null;
}

