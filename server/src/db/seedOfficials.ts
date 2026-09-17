import { eq, isNotNull } from "drizzle-orm";
import { db, schema } from "./client";
import type { ApprovalStatus, UserRole } from "./schema";

// Realistic Telangana Telugu names components
const MALE_NAMES = [
  "Venkatesh", "Ramana", "Srinivas", "Mallesh", "Chandrasekhar", "Rajendar",
  "Ravi", "Bhaskar", "Anjaiah", "Narsimha", "Prabhakar", "Lingaiah",
  "Yadagiri", "Shankaraiah", "Murali", "Satyanarayana", "Ramesh", "Gopal",
  "Tirupathi", "Shekhar", "Venu", "Mahender", "Devender", "Mohan",
  "Janardhan", "Krishna", "Naresh", "Rajesh", "Suresh", "Ashok",
  "Jagadish", "Kishan", "Sudhakar", "Ravinder", "Sampath", "Saidulu",
  "Srinath", "Balraj", "Ramulu", "Balaraju", "Prakash", "Vijay Kumar",
  "Raju", "Naveen", "Madhukar", "Chandramouli", "Hanmanthu", "Laxman",
  "Mallesham", "Bikshapathi", "Yellaiah", "Poshetti", "Sayanna", "Veeranna",
  "Muthaiah", "Ganesh", "Venkatram"
];

const FEMALE_NAMES = [
  "Laxmi", "Padma", "Renuka", "Saritha", "Sunitha", "Kavitha",
  "Anitha", "Swaroopa", "Radha", "Kalavathi", "Pushpa", "Lavanya",
  "Manjula", "Bhagya", "Sujatha", "Geetha", "Parvathi", "Swapna",
  "Shailaja", "Vijaya", "Satyavathi", "Mamatha", "Anuradha", "Sandhya",
  "Jyothi", "Sharada", "Sailaja", "Aruna", "Madhavi", "Vasantha",
  "Sridevi", "Vanaja", "Pushpalatha", "Suguna", "Nagamani", "Mangamma",
  "Rajitha", "Saroja", "Bhavani", "Jayaprada", "Padmavathi", "Varalaxmi",
  "Hemalatha", "Kalyani", "Devaki", "Latha"
];

const SURNAMES = [
  "Goud", "Reddy", "Yadav", "Mudiraj", "Rao", "Nayak", "Kuruma", "Varma",
  "Bandari", "Boina", "Dasari", "Gujjeti", "Maragoni", "Thota", "Singam",
  "Nomula", "Chennamaneni", "Errabelli", "Ponnala", "Batti", "Kancharla",
  "Palla", "Guvvala", "Gampa", "Karne", "Gadari", "Balka", "Alleti",
  "Vemula", "Rega", "Jogu", "Chinthakuntla", "Mothe", "Bodakunti",
  "Durgam", "Korukonda", "Mettu", "Sunkari", "Pagidipalli", "Vangala",
  "Peddapalli", "Ravula", "Madhavaram", "Gaddam", "Medipally", "Burra",
  "Mamidala", "Kasarla", "Gollapalli", "Komatireddy", "Dharani", "Palwai",
  "Goli", "Kolluri", "Chelimela", "Kotha", "Koppula", "Malkannagari"
];

const INITIALS = [
  "K.", "M.", "G.", "P.", "B.", "Ch.", "D.", "T.", "N.", "S.", "R.", "V.", "J.", "A.", "E.", "Y."
];

const DECLINE_NOTES = [
  "Voter ID address does not match Gram Panchayat jurisdiction",
  "Duplicate nomination received for the same ward",
  "Official declaration form incomplete; photo identification missing",
  "Aadhaar e-KYC mismatch with electoral roll entry",
  "Disqualified due to non-residency in ward boundaries",
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 15);
}

export interface SeedOfficialsStats {
  sarpanchesInserted: number;
  wardMembersInserted: number;
  authIdentitiesLinked: number;
  existingSarpanchesPreserved: number;
  existingWardMembersPreserved: number;
}

/**
 * Seeds Sarpanches and Ward Members for all registered Telangana jurisdictions.
 *
 * Design features:
 * - 1 Sarpanch per village
 * - 6 Ward Members (Ward 1 to 6) per village
 * - Realistic Telangana Telugu names (with representative gender balance reflecting local reservation)
 * - Deterministic, collision-free E.164 phone numbers (+91940000XXXX)
 * - Unique official email handles
 * - Approval status distribution (mostly approved for immediate live testing, with realistic pending/declined samples for admin queue)
 * - Linked authIdentities for instant phone OTP login
 * - Safe & idempotent: preserves existing officials and ignores duplicate runs
 */
export async function seedSarpanchesAndWardMembers(): Promise<SeedOfficialsStats> {
  // 1. Fetch all canonical jurisdictions
  const jurisdictions = await db
    .select()
    .from(schema.jurisdictions)
    .orderBy(
      schema.jurisdictions.district,
      schema.jurisdictions.mandal,
      schema.jurisdictions.village
    );

  if (jurisdictions.length === 0) {
    console.warn("[seed:officials] No jurisdictions found in database. Seed jurisdictions first.");
    return {
      sarpanchesInserted: 0,
      wardMembersInserted: 0,
      authIdentitiesLinked: 0,
      existingSarpanchesPreserved: 0,
      existingWardMembersPreserved: 0,
    };
  }

  // 2. Fetch existing users to ensure idempotency & avoid phone/email collisions
  const existingUsers = await db
    .select({
      id: schema.users.id,
      phone: schema.users.phone,
      email: schema.users.email,
      role: schema.users.role,
      wardNumber: schema.users.wardNumber,
      jurisdictionId: schema.users.jurisdictionId,
      approvalStatus: schema.users.approvalStatus,
    })
    .from(schema.users);

  const usedPhones = new Set<string>();
  const usedEmails = new Set<string>();
  const villagesWithSarpanch = new Set<string>();
  const villageWardMap = new Map<string, Set<string>>();

  let existingSarpanchesPreserved = 0;
  let existingWardMembersPreserved = 0;

  for (const u of existingUsers) {
    if (u.phone) usedPhones.add(u.phone);
    if (u.email) usedEmails.add(u.email.toLowerCase());

    if (u.jurisdictionId) {
      if (u.role === "sarpanch") {
        villagesWithSarpanch.add(u.jurisdictionId);
        existingSarpanchesPreserved++;
      } else if (u.role === "ward_member") {
        existingWardMembersPreserved++;
        if (u.wardNumber) {
          const wards = villageWardMap.get(u.jurisdictionId) ?? new Set<string>();
          wards.add(u.wardNumber);
          villageWardMap.set(u.jurisdictionId, wards);
        }
      }
    }
  }

  // Helper for generating deterministic phone numbers
  let phoneCounter = 1;
  function getNextPhone(): string {
    while (true) {
      const candidate = `+9194${String(phoneCounter).padStart(8, "0")}`;
      phoneCounter++;
      if (!usedPhones.has(candidate)) {
        usedPhones.add(candidate);
        return candidate;
      }
    }
  }

  // Helper for generating authentic Telangana names
  let nameIndex = 0;
  function generateName(preferFemale?: boolean): string {
    const isFemale = preferFemale !== undefined ? preferFemale : nameIndex % 2 === 1;
    const initial = INITIALS[nameIndex % INITIALS.length];
    const first = isFemale
      ? FEMALE_NAMES[nameIndex % FEMALE_NAMES.length]
      : MALE_NAMES[nameIndex % MALE_NAMES.length];
    const surname = SURNAMES[(nameIndex * 3 + 7) % SURNAMES.length];
    nameIndex++;
    return `${initial} ${first} ${surname}`;
  }

  type NewUser = typeof schema.users.$inferInsert;
  const usersToInsert: NewUser[] = [];

  let sarpanchCounter = 0;
  let wardMemberCounter = 0;

  for (let jIdx = 0; jIdx < jurisdictions.length; jIdx++) {
    const j = jurisdictions[jIdx];
    const distSlug = slugify(j.district);
    const mandSlug = slugify(j.mandal);
    const villSlug = slugify(j.village);

    // ── Sarpanch ────────────────────────────────────────────────────────────
    if (!villagesWithSarpanch.has(j.id)) {
      sarpanchCounter++;
      const isFemale = sarpanchCounter % 2 === 0; // 50% reservation
      const name = generateName(isFemale);
      const phone = getNextPhone();
      const email = `${distSlug}.${mandSlug}.${villSlug}.sarpanch@gramseva.tg.gov.in`;

      // Status distribution: ~96% approved, ~3% pending, ~1% declined
      let approvalStatus: ApprovalStatus = "approved";
      let approvalNote: string | null = null;
      if (sarpanchCounter % 35 === 0) {
        approvalStatus = "pending";
      } else if (sarpanchCounter % 60 === 0) {
        approvalStatus = "declined";
        approvalNote = DECLINE_NOTES[sarpanchCounter % DECLINE_NOTES.length];
      }

      usersToInsert.push({
        name,
        phone,
        email: usedEmails.has(email) ? `${phone.replace("+", "")}.${email}` : email,
        role: "sarpanch" as UserRole,
        approvalStatus,
        approvalNote,
        jurisdictionId: j.id,
        wardNumber: null,
      });
      usedEmails.add(email);
    }

    // ── Ward Members (Wards 1 to 10) ────────────────────────────────────────
    const existingWards = villageWardMap.get(j.id) ?? new Set<string>();
    for (let w = 1; w <= 10; w++) {
      const wardStr = String(w);
      if (existingWards.has(wardStr)) {
        continue;
      }

      wardMemberCounter++;
      const isFemale = (w + jIdx) % 2 === 0;
      const name = generateName(isFemale);
      const phone = getNextPhone();
      const email = `${distSlug}.${mandSlug}.${villSlug}.w${w}@gramseva.tg.gov.in`;

      usersToInsert.push({
        name,
        phone,
        email: usedEmails.has(email) ? `${phone.replace("+", "")}.${email}` : email,
        role: "ward_member" as UserRole,
        approvalStatus: "approved",
        approvalNote: null,
        jurisdictionId: j.id,
        wardNumber: wardStr,
      });
      usedEmails.add(email);
    }
  }

  // 3. Batch insert new users
  const chunkSize = 200;
  const newlyCreatedUsers: { id: string; phone: string | null; role: string }[] = [];

  for (let i = 0; i < usersToInsert.length; i += chunkSize) {
    const chunk = usersToInsert.slice(i, i + chunkSize);
    const result = await db
      .insert(schema.users)
      .values(chunk)
      .onConflictDoNothing()
      .returning({
        id: schema.users.id,
        phone: schema.users.phone,
        role: schema.users.role,
      });
    newlyCreatedUsers.push(...result);
  }

  const sarpanchesInserted = newlyCreatedUsers.filter((u) => u.role === "sarpanch").length;
  const wardMembersInserted = newlyCreatedUsers.filter((u) => u.role === "ward_member").length;

  // 4. Batch link phone auth identities for all officials (both newly inserted & existing unlinked)
  const usersToLinkAuth = await db
    .select({
      id: schema.users.id,
      phone: schema.users.phone,
    })
    .from(schema.users)
    .where(isNotNull(schema.users.phone));

  const authIdentityRows: { userId: string; provider: string; providerUid: string }[] = [];
  for (const u of usersToLinkAuth) {
    if (u.phone) {
      authIdentityRows.push({
        userId: u.id,
        provider: "phone",
        providerUid: u.phone,
      });
    }
  }

  let authIdentitiesLinked = 0;
  for (let i = 0; i < authIdentityRows.length; i += chunkSize) {
    const chunk = authIdentityRows.slice(i, i + chunkSize);
    const linked = await db
      .insert(schema.authIdentities)
      .values(chunk)
      .onConflictDoNothing()
      .returning({ id: schema.authIdentities.id });
    authIdentitiesLinked += linked.length;
  }

  // Ensure all ward members are approved so every ward appears in the village directory
  await db
    .update(schema.users)
    .set({ approvalStatus: "approved" })
    .where(eq(schema.users.role, "ward_member"));

  return {
    sarpanchesInserted,
    wardMembersInserted,
    authIdentitiesLinked,
    existingSarpanchesPreserved,
    existingWardMembersPreserved,
  };
}
