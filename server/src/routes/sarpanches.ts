import { Hono } from "hono";
import { and, asc, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db, schema } from "../db/client";
import { requireAuth, getAuth } from "../middleware/auth";
import { notFound } from "../middleware/error";
import { findJurisdictionByName } from "../services/jurisdictions";
import type { IssueStatus } from "../../../shared/types";

export const sarpanchesRoutes = new Hono()
  .use("*", requireAuth)
  /**
   * Village-wise sarpanch listing with overview stats and cascading filters.
   * Citizens strictly see sarpanches for their own village.
   * Officials/admins see filtered or statewide directories.
   */
  .get("/", async (c) => {
    const { user, jurisdiction } = getAuth(c);

    // Citizen isolation rule: Citizens ONLY see sarpanch for their own registered village
    if (user.role === "citizen") {
      if (!jurisdiction) {
        return c.json({
          overview: {
            totalSarpanches: 0,
            approvedSarpanches: 0,
            pendingSarpanches: 0,
            declinedSarpanches: 0,
            villagesCovered: 0,
          },
          sarpanches: [],
        });
      }

      const rows = await db
        .select({
          user: schema.users,
          jurisdiction: schema.jurisdictions,
        })
        .from(schema.users)
        .leftJoin(schema.jurisdictions, eq(schema.users.jurisdictionId, schema.jurisdictions.id))
        .where(
          and(
            eq(schema.users.role, "sarpanch"),
            eq(schema.users.jurisdictionId, jurisdiction.id)
          )
        )
        .orderBy(desc(schema.users.createdAt));

      const issuesCounts = new Map<string, { total: number; open: number; resolved: number }>();
      const issueRows = await db
        .select({
          jurisdictionId: schema.issues.jurisdictionId,
          status: schema.issues.status,
          count: count(),
        })
        .from(schema.issues)
        .where(
          and(
            eq(schema.issues.jurisdictionId, jurisdiction.id),
            or(eq(schema.issues.visibility, "village"), eq(schema.issues.reporterId, user.id))
          )
        )
        .groupBy(schema.issues.jurisdictionId, schema.issues.status);

      for (const r of issueRows) {
        const entry = issuesCounts.get(r.jurisdictionId) ?? { total: 0, open: 0, resolved: 0 };
        const n = Number(r.count);
        entry.total += n;
        if (r.status === "Resolved" || r.status === "Closed") {
          entry.resolved += n;
        } else {
          entry.open += n;
        }
        issuesCounts.set(r.jurisdictionId, entry);
      }

      const sarpanches = rows.map(({ user: u, jurisdiction: j }) => ({
        id: u.id,
        name: u.name,
        phone: u.phone,
        email: u.email,
        role: u.role,
        approvalStatus: u.approvalStatus,
        approvalNote: u.approvalNote,
        wardNumber: u.wardNumber,
        jurisdictionId: u.jurisdictionId,
        district: j?.district ?? null,
        mandal: j?.mandal ?? null,
        village: j?.village ?? null,
        createdAt: u.createdAt.toISOString(),
        issuesCount: issuesCounts.get(jurisdiction.id) ?? { total: 0, open: 0, resolved: 0 },
      }));

      const overview = {
        totalSarpanches: sarpanches.length,
        approvedSarpanches: sarpanches.filter((s) => s.approvalStatus === "approved").length,
        pendingSarpanches: sarpanches.filter((s) => s.approvalStatus === "pending").length,
        declinedSarpanches: sarpanches.filter((s) => s.approvalStatus === "declined").length,
        villagesCovered: sarpanches.filter((s) => s.approvalStatus === "approved").length > 0 ? 1 : 0,
      };

      return c.json({ overview, sarpanches });
    }

    const district = c.req.query("district")?.trim();
    const mandal = c.req.query("mandal")?.trim();
    const village = c.req.query("village")?.trim();
    const status = c.req.query("status")?.trim();
    const q = c.req.query("q")?.trim();

    // 1. Overall Sarpanch Statistics
    const allSarpanches = await db
      .select({
        approvalStatus: schema.users.approvalStatus,
        jurisdictionId: schema.users.jurisdictionId,
      })
      .from(schema.users)
      .where(eq(schema.users.role, "sarpanch"));

    const overview = {
      totalSarpanches: allSarpanches.length,
      approvedSarpanches: allSarpanches.filter((s) => s.approvalStatus === "approved").length,
      pendingSarpanches: allSarpanches.filter((s) => s.approvalStatus === "pending").length,
      declinedSarpanches: allSarpanches.filter((s) => s.approvalStatus === "declined").length,
      villagesCovered: new Set(
        allSarpanches
          .filter((s) => s.approvalStatus === "approved" && s.jurisdictionId)
          .map((s) => s.jurisdictionId)
      ).size,
    };

    // 2. Filtered Query
    const conditions = [eq(schema.users.role, "sarpanch")];
    if (status && ["pending", "approved", "declined"].includes(status)) {
      conditions.push(eq(schema.users.approvalStatus, status as "pending" | "approved" | "declined"));
    }
    if (district) {
      conditions.push(ilike(schema.jurisdictions.district, `%${district}%`));
    }
    if (mandal) {
      conditions.push(ilike(schema.jurisdictions.mandal, `%${mandal}%`));
    }
    if (village) {
      conditions.push(ilike(schema.jurisdictions.village, `%${village}%`));
    }
    if (q) {
      const term = `%${q}%`;
      const searchMatch = or(
        ilike(schema.users.name, term),
        ilike(schema.users.phone, term),
        ilike(schema.jurisdictions.village, term),
        ilike(schema.jurisdictions.mandal, term),
        ilike(schema.jurisdictions.district, term)
      );
      if (searchMatch) conditions.push(searchMatch);
    }

    const rows = await db
      .select({
        user: schema.users,
        jurisdiction: schema.jurisdictions,
      })
      .from(schema.users)
      .leftJoin(schema.jurisdictions, eq(schema.users.jurisdictionId, schema.jurisdictions.id))
      .where(and(...conditions))
      .orderBy(
        schema.jurisdictions.district,
        schema.jurisdictions.mandal,
        schema.jurisdictions.village,
        desc(schema.users.createdAt)
      )
      .limit(300);

    // 3. Attach Issue Counts per Village
    const jurisdictionIds = Array.from(
      new Set(rows.map((r) => r.user.jurisdictionId).filter((id): id is string => Boolean(id)))
    );

    const issuesCounts = new Map<string, { total: number; open: number; resolved: number }>();
    if (jurisdictionIds.length > 0) {
      const issueRows = await db
        .select({
          jurisdictionId: schema.issues.jurisdictionId,
          status: schema.issues.status,
          count: count(),
        })
        .from(schema.issues)
        .where(inArray(schema.issues.jurisdictionId, jurisdictionIds))
        .groupBy(schema.issues.jurisdictionId, schema.issues.status);

      for (const r of issueRows) {
        const entry = issuesCounts.get(r.jurisdictionId) ?? { total: 0, open: 0, resolved: 0 };
        const n = Number(r.count);
        entry.total += n;
        if (r.status === "Resolved" || r.status === "Closed") {
          entry.resolved += n;
        } else {
          entry.open += n;
        }
        issuesCounts.set(r.jurisdictionId, entry);
      }
    }

    const sarpanches = rows.map(({ user, jurisdiction }) => ({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      approvalStatus: user.approvalStatus,
      approvalNote: user.approvalNote,
      wardNumber: user.wardNumber,
      jurisdictionId: user.jurisdictionId,
      district: jurisdiction?.district ?? null,
      mandal: jurisdiction?.mandal ?? null,
      village: jurisdiction?.village ?? null,
      createdAt: user.createdAt.toISOString(),
      issuesCount: user.jurisdictionId
        ? issuesCounts.get(user.jurisdictionId) ?? { total: 0, open: 0, resolved: 0 }
        : undefined,
    }));

    return c.json({ overview, sarpanches });
  })

  /**
   * Detailed village view: returns primary sarpanch, all sarpanch applications,
   * elected ward members, and village issue status metrics.
   */
  .get("/village", async (c) => {
    const { user, jurisdiction } = getAuth(c);

    let targetJurisdiction: typeof schema.jurisdictions.$inferSelect | null = null;

    if (user.role === "citizen") {
      if (!jurisdiction) {
        throw notFound("Village jurisdiction not found");
      }
      // Citizen is strictly locked to their own registered village
      targetJurisdiction = jurisdiction;
    } else {
      const jurisdictionId = c.req.query("jurisdictionId");
      const district = c.req.query("district")?.trim();
      const mandal = c.req.query("mandal")?.trim();
      const village = c.req.query("village")?.trim();

      if (jurisdictionId) {
        const [j] = await db
          .select()
          .from(schema.jurisdictions)
          .where(eq(schema.jurisdictions.id, jurisdictionId))
          .limit(1);
        targetJurisdiction = j ?? null;
      } else if (district && mandal && village) {
        targetJurisdiction = await findJurisdictionByName(district, mandal, village);
      }

      if (!targetJurisdiction) {
        throw notFound("Village jurisdiction not found");
      }
    }

    // 1. Sarpanches for this village
    const sarpanchUsers = await db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.jurisdictionId, targetJurisdiction.id),
          eq(schema.users.role, "sarpanch")
        )
      )
      .orderBy(
        desc(eq(schema.users.approvalStatus, "approved")),
        desc(eq(schema.users.approvalStatus, "pending")),
        desc(schema.users.createdAt)
      );

    const toSarpanchRecord = (u: typeof schema.users.$inferSelect) => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      email: u.email,
      role: u.role as "sarpanch",
      approvalStatus: u.approvalStatus,
      approvalNote: u.approvalNote,
      wardNumber: u.wardNumber,
      jurisdictionId: u.jurisdictionId,
      district: targetJurisdiction!.district,
      mandal: targetJurisdiction!.mandal,
      village: targetJurisdiction!.village,
      createdAt: u.createdAt.toISOString(),
    });

    const allSarpanches = sarpanchUsers.map(toSarpanchRecord);
    const primarySarpanch =
      allSarpanches.find((s) => s.approvalStatus === "approved") ?? allSarpanches[0] ?? null;

    // 2. Ward Members for this village (include pending, approved, and declined)
    const wardMembers = await db
      .select()
      .from(schema.users)
      .where(
        and(
          eq(schema.users.jurisdictionId, targetJurisdiction.id),
          eq(schema.users.role, "ward_member")
        )
      )
      .orderBy(asc(schema.users.wardNumber), desc(schema.users.createdAt));

    // 3. Issue Summary for this village
    const villageIssues = await db
      .select({
        status: schema.issues.status,
        count: count(),
      })
      .from(schema.issues)
      .where(eq(schema.issues.jurisdictionId, targetJurisdiction.id))
      .groupBy(schema.issues.status);

    const issuesSummary = {
      total: 0,
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0,
    };
    for (const row of villageIssues) {
      const n = Number(row.count);
      issuesSummary.total += n;
      if (row.status === "Resolved") issuesSummary.resolved += n;
      else if (row.status === "Closed") issuesSummary.closed += n;
      else if (row.status === "In Progress") issuesSummary.inProgress += n;
      else issuesSummary.open += n;
    }

    // 4. Recent Issues in this village (masked or filtered for citizen)
    const recentIssueConditions = [eq(schema.issues.jurisdictionId, targetJurisdiction.id)];
    if (user.role === "citizen") {
      recentIssueConditions.push(
        or(eq(schema.issues.visibility, "village"), eq(schema.issues.reporterId, user.id))!
      );
    }

    const recentIssues = await db
      .select({
        id: schema.issues.id,
        code: schema.issues.code,
        category: schema.issues.category,
        status: schema.issues.status,
        createdAt: schema.issues.createdAt,
      })
      .from(schema.issues)
      .where(and(...recentIssueConditions))
      .orderBy(desc(schema.issues.createdAt))
      .limit(5);

    return c.json({
      jurisdiction: {
        id: targetJurisdiction.id,
        district: targetJurisdiction.district,
        mandal: targetJurisdiction.mandal,
        village: targetJurisdiction.village,
      },
      sarpanch: primarySarpanch,
      allSarpanches,
      wardMembers: wardMembers.map((w) => ({
        id: w.id,
        name: w.name,
        phone: w.phone,
        email: w.email,
        wardNumber: w.wardNumber,
        approvalStatus: w.approvalStatus,
        approvalNote: w.approvalNote,
        createdAt: w.createdAt.toISOString(),
      })),
      issuesSummary,
      recentIssues: recentIssues.map((i) => ({
        id: i.id,
        code: i.code,
        category: i.category,
        status: i.status as IssueStatus,
        createdAt: i.createdAt.toISOString(),
      })),
    });
  });
