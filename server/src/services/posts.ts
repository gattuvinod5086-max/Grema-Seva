import { and, count, desc, eq, ilike, isNull, or, SQL } from "drizzle-orm";
import { db, schema } from "../db/client";
import type { Jurisdiction, User } from "../db/schema";
import { badRequest, forbidden, notFound } from "../middleware/error";
import { findJurisdictionByName } from "./jurisdictions";
import type { CreatePostInput } from "../../../shared/types";

export interface ListPostsOptions {
  type?: "notice" | "news";
  category?: string;
  district?: string;
  mandal?: string;
  village?: string;
  page: number;
  limit: number;
}

export async function createPost(
  user: User,
  userJurisdiction: Jurisdiction | null,
  input: CreatePostInput
) {
  let targetJurisdictionId: string | null = null;
  let wardNumber: string | null = input.wardNumber ?? null;

  if (input.type === "notice") {
    // Notice rule: Only authorized public officials can publish notices
    const isOfficial =
      user.role === "super_admin" ||
      user.role === "admin" ||
      (["sarpanch", "ward_member", "mandal_official"].includes(user.role) && user.approvalStatus === "approved");

    if (!isOfficial) {
      throw forbidden(
        "Only authorized public officials (Sarpanch, Ward Member, Mandal Official, Administrator) can publish official public notices"
      );
    }

    if (user.role === "sarpanch" || user.role === "ward_member") {
      if (!userJurisdiction) {
        throw badRequest("Official must have an assigned village jurisdiction to publish village notices");
      }
      targetJurisdictionId = userJurisdiction.id;
      wardNumber = user.role === "ward_member" ? (input.wardNumber || user.wardNumber || null) : null;
    } else if (user.role === "mandal_official") {
      if (!userJurisdiction) {
        throw badRequest("Official must have an assigned mandal jurisdiction to publish notices");
      }
      if (input.district && input.mandal && input.village) {
        if (
          input.district.toLowerCase() !== userJurisdiction.district.toLowerCase() ||
          input.mandal.toLowerCase() !== userJurisdiction.mandal.toLowerCase()
        ) {
          throw forbidden("Mandal officials can only publish notices within their own mandal");
        }
        const j = await findJurisdictionByName(input.district.trim(), input.mandal.trim(), input.village.trim());
        targetJurisdictionId = j?.id ?? null;
      } else {
        targetJurisdictionId = userJurisdiction.id;
      }
    } else {
      // Super Admin or Admin: can target a specific village or statewide
      if (input.district && input.mandal && input.village) {
        const j = await findJurisdictionByName(input.district.trim(), input.mandal.trim(), input.village.trim());
        targetJurisdictionId = j?.id ?? null;
      } else if (userJurisdiction) {
        targetJurisdictionId = userJurisdiction.id;
      }
    }
  } else {
    // News rule: citizens, ward members, and sarpanches can only publish news for their own village
    if (user.role === "citizen" || user.role === "sarpanch" || user.role === "ward_member") {
      targetJurisdictionId = userJurisdiction?.id ?? null;
    } else if (user.role === "mandal_official") {
      if (!userJurisdiction) {
        throw badRequest("Official must have an assigned mandal jurisdiction to publish news");
      }
      if (input.district && input.mandal && input.village) {
        if (
          input.district.toLowerCase() !== userJurisdiction.district.toLowerCase() ||
          input.mandal.toLowerCase() !== userJurisdiction.mandal.toLowerCase()
        ) {
          throw forbidden("Mandal officials can only publish news within their own mandal");
        }
        const j = await findJurisdictionByName(input.district.trim(), input.mandal.trim(), input.village.trim());
        targetJurisdictionId = j?.id ?? null;
      } else {
        targetJurisdictionId = userJurisdiction.id;
      }
    } else if (input.district && input.mandal && input.village) {
      const j = await findJurisdictionByName(input.district.trim(), input.mandal.trim(), input.village.trim());
      targetJurisdictionId = j?.id ?? null;
    } else {
      targetJurisdictionId = userJurisdiction?.id ?? null;
    }
  }

  const [post] = await db
    .insert(schema.posts)
    .values({
      type: input.type,
      title: input.title.trim(),
      content: (input.content ?? "").trim(),
      category: input.category.trim(),
      priority: input.priority ?? "NORMAL",
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      jurisdictionId: targetJurisdictionId,
      wardNumber,
      imageUrl: input.imageUrl?.trim() || null,
      pinned: input.pinned ?? false,
    })
    .returning();

  return post;
}

export async function listPosts(
  user: User,
  userJurisdiction: Jurisdiction | null,
  options: ListPostsOptions
) {
  const conditions: SQL[] = [];

  if (options.type) {
    conditions.push(eq(schema.posts.type, options.type));
  }

  if (options.category) {
    conditions.push(eq(schema.posts.category, options.category));
  }

  // Location scoping:
  // 1. Village-scoped roles (citizen, sarpanch, ward_member) strictly see posts for their village + statewide
  if (user.role === "citizen" || user.role === "sarpanch" || user.role === "ward_member") {
    if (userJurisdiction) {
      conditions.push(
        or(
          eq(schema.posts.jurisdictionId, userJurisdiction.id),
          isNull(schema.posts.jurisdictionId)
        )!
      );
    } else {
      conditions.push(isNull(schema.posts.jurisdictionId));
    }
  } else if (user.role === "mandal_official" && userJurisdiction) {
    // 2. Mandal Official strictly sees posts belonging to villages in their mandal + statewide
    if (options.village) {
      conditions.push(
        or(
          and(
            ilike(schema.jurisdictions.district, userJurisdiction.district),
            ilike(schema.jurisdictions.mandal, userJurisdiction.mandal),
            ilike(schema.jurisdictions.village, options.village.trim())
          ),
          isNull(schema.posts.jurisdictionId)
        )!
      );
    } else {
      conditions.push(
        or(
          and(
            ilike(schema.jurisdictions.district, userJurisdiction.district),
            ilike(schema.jurisdictions.mandal, userJurisdiction.mandal)
          ),
          isNull(schema.posts.jurisdictionId)
        )!
      );
    }
  } else if (options.village) {
    // Match that village OR statewide notices (jurisdictionId is null)
    conditions.push(
      or(
        ilike(schema.jurisdictions.village, options.village.trim()),
        isNull(schema.posts.jurisdictionId)
      )!
    );
  } else if (options.mandal) {
    conditions.push(
      or(
        ilike(schema.jurisdictions.mandal, options.mandal.trim()),
        isNull(schema.posts.jurisdictionId)
      )!
    );
  } else if (options.district) {
    conditions.push(
      or(
        ilike(schema.jurisdictions.district, options.district.trim()),
        isNull(schema.posts.jurisdictionId)
      )!
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ total }] = await db
    .select({ total: count() })
    .from(schema.posts)
    .leftJoin(schema.jurisdictions, eq(schema.posts.jurisdictionId, schema.jurisdictions.id))
    .where(where);

  const rows = await db
    .select({
      post: schema.posts,
      jurisdiction: schema.jurisdictions,
    })
    .from(schema.posts)
    .leftJoin(schema.jurisdictions, eq(schema.posts.jurisdictionId, schema.jurisdictions.id))
    .where(where)
    .orderBy(desc(schema.posts.pinned), desc(schema.posts.createdAt))
    .limit(Math.min(options.limit, 100))
    .offset((options.page - 1) * options.limit);

  return {
    posts: rows.map(({ post, jurisdiction: j }) => ({
      ...post,
      district: j?.district ?? null,
      mandal: j?.mandal ?? null,
      village: j?.village ?? null,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
    })),
    total: Number(total),
    page: options.page,
    limit: options.limit,
  };
}

export async function deletePost(user: User, postId: string) {
  const [post] = await db
    .select()
    .from(schema.posts)
    .where(eq(schema.posts.id, postId))
    .limit(1);

  if (!post) throw notFound("Post not found");

  const isSuperAdmin = user.role === "super_admin" || user.role === "admin";
  const isAuthor = post.authorId === user.id;

  if (!isSuperAdmin && !isAuthor) {
    throw forbidden("You are not authorized to delete this post");
  }

  await db.delete(schema.posts).where(eq(schema.posts.id, postId));
  return { ok: true, post };
}
