import "dotenv/config";
import { eq } from "drizzle-orm";
import { db, client, schema } from "./client";
import { telanganaData } from "../../../shared/data/telangana";
import { env } from "../env";
import { seedSarpanchesAndWardMembers } from "./seedOfficials";

/**
 * Seeds:
 *  1. jurisdictions — every village from the Telangana dataset
 *  2. the super admin (phone from SUPER_ADMIN_PHONE, auto-approved)
 *  3. officials — Sarpanches and Ward Members for all villages
 *
 * Idempotent: safe to run repeatedly (onConflictDoNothing / upsert).
 */
async function seedJurisdictions() {
  const rows: { district: string; mandal: string; village: string }[] = [];
  for (const district of telanganaData) {
    for (const mandal of district.mandals) {
      for (const village of mandal.villages) {
        rows.push({
          district: district.name.trim(),
          mandal: mandal.name.trim(),
          village: village.name.trim(),
        });
      }
    }
  }

  // Chunked inserts keep parameter counts within driver limits.
  const chunkSize = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const result = await db
      .insert(schema.jurisdictions)
      .values(chunk)
      .onConflictDoNothing()
      .returning({ id: schema.jurisdictions.id });
    inserted += result.length;
  }
  console.log(`[seed] jurisdictions: ${rows.length} rows processed, ${inserted} newly inserted`);
}

async function seedSuperAdmin() {
  const phone = env.SUPER_ADMIN_PHONE.startsWith("+")
    ? env.SUPER_ADMIN_PHONE
    : `+91${env.SUPER_ADMIN_PHONE}`;

  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.phone, phone))
    .limit(1);

  if (existing.length > 0) {
    if (existing[0].role !== "super_admin") {
      await db
        .update(schema.users)
        .set({ role: "super_admin", approvalStatus: "approved", updatedAt: new Date() })
        .where(eq(schema.users.id, existing[0].id));
      console.log(`[seed] upgraded existing user ${phone} to super_admin`);
    } else {
      console.log(`[seed] super admin ${phone} already exists`);
    }
    return;
  }

  await db.insert(schema.users).values({
    name: "Super Admin",
    phone,
    role: "super_admin",
    approvalStatus: "approved",
  });
  console.log(`[seed] created super admin ${phone}`);
}

async function seedOfficials() {
  const stats = await seedSarpanchesAndWardMembers();
  console.log(
    `[seed] officials: ${stats.sarpanchesInserted} sarpanches inserted (${stats.existingSarpanchesPreserved} preserved), ` +
      `${stats.wardMembersInserted} ward members inserted (${stats.existingWardMembersPreserved} preserved), ` +
      `${stats.authIdentitiesLinked} auth identities linked`
  );
}

async function main() {
  await seedJurisdictions();
  await seedSuperAdmin();
  await seedOfficials();
}

main()
  .then(() => {
    console.log("[seed] done");
    return client.end();
  })
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error("[seed] failed:", err);
    await client.end().catch(() => {});
    process.exit(1);
  });
