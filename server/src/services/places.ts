import { and, eq, ilike, isNull } from "drizzle-orm";
import { db, schema } from "../db/client";
import type { User } from "../db/schema";
import { normalizeImageUrl } from "../../../shared/utils/imageUrl";
import type { SetPlaceImageInput, PlaceImageRecord } from "../../../shared/types";
import { badRequest, forbidden } from "../middleware/error";

export async function listPlaceImages(filter?: {
  district?: string;
  mandal?: string;
  village?: string;
}): Promise<PlaceImageRecord[]> {
  const conditions = [];

  if (filter?.district) {
    conditions.push(ilike(schema.placeImages.district, filter.district.trim()));
  }
  if (filter?.mandal) {
    conditions.push(ilike(schema.placeImages.mandal, filter.mandal.trim()));
  }
  if (filter?.village) {
    conditions.push(ilike(schema.placeImages.village, filter.village.trim()));
  }

  const rows = await db
    .select()
    .from(schema.placeImages)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return rows.map((r) => ({
    id: r.id,
    level: r.level as "district" | "mandal" | "village",
    district: r.district,
    mandal: r.mandal,
    village: r.village,
    imageUrl: r.imageUrl,
    caption: r.caption,
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function setPlaceImage(
  user: User,
  input: SetPlaceImageInput
): Promise<PlaceImageRecord | null> {
  if (user.role !== "admin" && user.role !== "super_admin") {
    throw forbidden("Only administrators can configure place images");
  }

  const district = input.district.trim();
  const mandal = input.mandal?.trim() || null;
  const village = input.village?.trim() || null;
  const rawUrl = input.imageUrl.trim();
  const caption = input.caption?.trim() || null;

  // Conditions for matching existing record
  const matchConditions = [
    eq(schema.placeImages.level, input.level),
    ilike(schema.placeImages.district, district),
  ];

  if (input.level === "district") {
    matchConditions.push(isNull(schema.placeImages.mandal));
    matchConditions.push(isNull(schema.placeImages.village));
  } else if (input.level === "mandal") {
    if (!mandal) throw badRequest("Mandal name is required for mandal-level image");
    matchConditions.push(ilike(schema.placeImages.mandal, mandal));
    matchConditions.push(isNull(schema.placeImages.village));
  } else if (input.level === "village") {
    if (!mandal || !village) {
      throw badRequest("Mandal and Village names are required for village-level image");
    }
    matchConditions.push(ilike(schema.placeImages.mandal, mandal));
    matchConditions.push(ilike(schema.placeImages.village, village));
  }

  const [existing] = await db
    .select()
    .from(schema.placeImages)
    .where(and(...matchConditions))
    .limit(1);

  // If URL is empty, delete existing record if present
  if (!rawUrl) {
    if (existing) {
      await db
        .delete(schema.placeImages)
        .where(eq(schema.placeImages.id, existing.id));
    }
    return null;
  }

  // Normalize image URL (e.g. converting Google Drive / Dropbox share URLs to direct CDN)
  const normalizedUrl = normalizeImageUrl(rawUrl);

  if (existing) {
    const [updated] = await db
      .update(schema.placeImages)
      .set({
        imageUrl: normalizedUrl,
        caption,
        updatedById: user.id,
        updatedAt: new Date(),
      })
      .where(eq(schema.placeImages.id, existing.id))
      .returning();

    return {
      id: updated.id,
      level: updated.level as "district" | "mandal" | "village",
      district: updated.district,
      mandal: updated.mandal,
      village: updated.village,
      imageUrl: updated.imageUrl,
      caption: updated.caption,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  const [created] = await db
    .insert(schema.placeImages)
    .values({
      level: input.level,
      district,
      mandal: input.level === "district" ? null : mandal,
      village: input.level === "village" ? village : null,
      imageUrl: normalizedUrl,
      caption,
      updatedById: user.id,
    })
    .returning();

  return {
    id: created.id,
    level: created.level as "district" | "mandal" | "village",
    district: created.district,
    mandal: created.mandal,
    village: created.village,
    imageUrl: created.imageUrl,
    caption: created.caption,
    updatedAt: created.updatedAt.toISOString(),
  };
}
