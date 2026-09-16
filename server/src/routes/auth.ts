import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getCookie, setCookie } from "hono/cookie";
import { db, schema } from "../db/client";
import { env, isGoogleOAuthConfigured } from "../env";
import { normalizePhone } from "../lib/phone";
import { generateToken } from "../lib/crypto";
import { requestOtp, verifyOtp, assertVerificationOk } from "../services/otp";
import { getSmsProvider } from "../providers/sms";
import { createSession, revokeCurrentSession } from "../services/session";
import { findIdentityUser, linkIdentity, serializeUser } from "../services/users";
import { findJurisdictionByName, findFirstJurisdictionByMandal } from "../services/jurisdictions";
import { badRequest, conflict } from "../middleware/error";
import { requireAuth } from "../middleware/auth";
import { loadJurisdiction } from "../services/users";
import { personNameSchema, indianMobileSchema } from "../../../shared/validation";

const otpRequestSchema = z.object({
  phone: z.string().min(1),
});

const otpVerifySchema = z.object({
  phone: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});

const officialRoles = ["sarpanch", "admin", "ward_member", "mandal_official"] as const;

const registerOfficialSchema = z
  .object({
    phone: indianMobileSchema,
    code: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
    name: personNameSchema,
    role: z.enum(officialRoles),
    district: z.string().trim().optional(),
    mandal: z.string().trim().optional(),
    village: z.string().trim().optional(),
    wardNumber: z
      .string()
      .trim()
      .regex(/^\d{1,3}$/, "Ward number must be 1–3 digits")
      .optional(),
  })
  .superRefine((val, ctx) => {
    if (val.role === "admin") {
      // Admin requires no location
      return;
    }
    if (val.role === "mandal_official") {
      if (!val.district) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "District is required for Mandal Official", path: ["district"] });
      }
      if (!val.mandal) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Mandal is required for Mandal Official", path: ["mandal"] });
      }
      return;
    }
    // sarpanch and ward_member
    if (!val.district) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "District is required", path: ["district"] });
    }
    if (!val.mandal) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Mandal is required", path: ["mandal"] });
    }
    if (!val.village) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Village is required", path: ["village"] });
    }
    if (val.role === "ward_member" && !val.wardNumber) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ward number is required for Ward Member", path: ["wardNumber"] });
    }
  });


const GOOGLE_STATE_COOKIE = "grama_oauth_state";
const GOOGLE_CALLBACK_PATH = "/api/auth/google/callback";

export const authRoutes = new Hono()
  /* ---------- Phone OTP ---------- */
  .post("/otp/request", async (c) => {
    const { phone: rawPhone } = otpRequestSchema.parse(await c.req.json());
    const phone = normalizePhone(rawPhone);
    if (!phone) throw badRequest("Enter a valid mobile number");

    const result = await requestOtp(phone, c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"));

    // Dev drivers surface the code in the response so the UI can display
    // it without a real SMS; production providers never do.
    const devOtp = getSmsProvider().exposesDevOtp ? result.code : undefined;

    return c.json({ sent: true, expiresInSec: result.expiresInSec, devOtp });
  })
  .post("/otp/verify", async (c) => {
    const { phone: rawPhone, code } = otpVerifySchema.parse(await c.req.json());
    const phone = normalizePhone(rawPhone);
    if (!phone) throw badRequest("Enter a valid mobile number");

    assertVerificationOk(await verifyOtp(phone, code));

    // Find or provision the account behind this phone.
    let user = await findIdentityUser("phone", phone);
    if (!user) {
      const [byPhone] = await db.select().from(schema.users).where(eq(schema.users.phone, phone)).limit(1);
      if (byPhone) {
        user = byPhone;
      } else {
        const [created] = await db
          .insert(schema.users)
          .values({ name: "New User", phone, role: "citizen", approvalStatus: "approved" })
          .returning();
        user = created;
      }
      await linkIdentity(user.id, "phone", phone);
    }

    await createSession(c, user.id, {
      ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
      device: c.req.header("user-agent"),
    });

    const jurisdiction = await loadJurisdiction(user.jurisdictionId);
    return c.json({ user: serializeUser(user, jurisdiction) });
  })

  /* ---------- Official registration (OTP-verified, pending approval) ---------- */
  .post("/register/official", async (c) => {
    const input = registerOfficialSchema.parse(await c.req.json());

    const phone = normalizePhone(input.phone);
    if (!phone) throw badRequest("Enter a valid mobile number");

    assertVerificationOk(await verifyOtp(phone, input.code));

    let jurisdiction: Awaited<ReturnType<typeof findJurisdictionByName>> = null;
    if (input.role === "mandal_official") {
      jurisdiction = await findFirstJurisdictionByMandal(input.district!, input.mandal!);
      if (!jurisdiction) {
        throw badRequest("No registered villages found for the selected mandal.");
      }
    } else if (input.role === "admin") {
      jurisdiction = null;
    } else {
      // sarpanch or ward_member
      jurisdiction = await findJurisdictionByName(
        input.district!,
        input.mandal!,
        input.village!
      );
      if (!jurisdiction) {
        throw badRequest("Selected village is not registered. Please choose from the list.");
      }
    }

    const jurisdictionId = jurisdiction ? jurisdiction.id : null;
    const wardNumber = input.role === "ward_member" ? input.wardNumber ?? null : null;

    const existing = await findIdentityUser("phone", phone);
    if (existing) {
      if (existing.role === "citizen" || existing.approvalStatus === "declined") {
        const [updated] = await db
          .update(schema.users)
          .set({
            name: input.name,
            role: input.role,
            approvalStatus: "pending",
            approvalNote: null,
            jurisdictionId,
            wardNumber,
            updatedAt: new Date(),
          })
          .where(eq(schema.users.id, existing.id))
          .returning();

        await db.insert(schema.auditLog).values({
          actorId: updated.id,
          action: "official.registration.submitted",
          entity: "user",
          entityId: updated.id,
          after: { role: input.role, jurisdictionId },
          ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
        });

        await createSession(c, updated.id, {
          ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
          device: c.req.header("user-agent"),
        });

        return c.json({ user: serializeUser(updated, jurisdiction) }, 200);
      }

      if (existing.approvalStatus === "pending") {
        throw badRequest("An official registration is already pending review for this mobile number.");
      }

      throw conflict("This mobile number already has an account. Sign in instead, or use a different number.");
    }

    const [user] = await db
      .insert(schema.users)
      .values({
        name: input.name,
        phone,
        role: input.role,
        // Officials hold no official powers until a super admin approves them.
        approvalStatus: "pending",
        jurisdictionId,
        wardNumber,
      })
      .returning();
    await linkIdentity(user.id, "phone", phone);

    await db.insert(schema.auditLog).values({
      actorId: user.id,
      action: "official.registration.submitted",
      entity: "user",
      entityId: user.id,
      after: { role: input.role, jurisdictionId },
      ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    });

    await createSession(c, user.id, {
      ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
      device: c.req.header("user-agent"),
    });

    return c.json({ user: serializeUser(user, jurisdiction) }, 201);
  })

  /* ---------- Google OAuth ---------- */
  .get("/google/redirect-url", (c) => {
    if (!isGoogleOAuthConfigured()) {
      return c.json(
        {
          error: {
            code: "GOOGLE_NOT_CONFIGURED",
            message:
              "Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.",
          },
        },
        503
      );
    }

    const state = generateToken();
    setCookie(c, GOOGLE_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "Lax",
      secure: env.APP_BASE_URL.startsWith("https"),
      path: "/",
      maxAge: 600,
    });

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", env.GOOGLE_CLIENT_ID!);
    url.searchParams.set("redirect_uri", `${env.APP_BASE_URL}${GOOGLE_CALLBACK_PATH}`);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("state", state);
    url.searchParams.set("prompt", "select_account");

    return c.json({ redirectUrl: url.toString() });
  })
  .get("/google/callback", async (c) => {
    const redirectTo = (path: string) => c.redirect(`${env.APP_BASE_URL}${path}`);

    const code = c.req.query("code");
    const state = c.req.query("state");
    const expectedState = getCookie(c, GOOGLE_STATE_COOKIE);
    setCookie(c, GOOGLE_STATE_COOKIE, "", { path: "/", maxAge: 0 });

    if (!code || !state || !expectedState || state !== expectedState) {
      return redirectTo("/login?error=google_state");
    }

    if (!isGoogleOAuthConfigured()) {
      return redirectTo("/login?error=google_config");
    }

    // Exchange the authorization code for tokens.
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID!,
        client_secret: env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${env.APP_BASE_URL}${GOOGLE_CALLBACK_PATH}`,
        grant_type: "authorization_code",
      }),
    });
    const tokens = (await tokenRes.json().catch(() => ({}))) as { access_token?: string };
    if (!tokenRes.ok || !tokens.access_token) {
      return redirectTo("/login?error=google_token");
    }

    // Resolve the verified identity from Google's userinfo endpoint.
    const userInfoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const info = (await userInfoRes.json().catch(() => ({}))) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
    };
    if (!userInfoRes.ok || !info.sub) {
      return redirectTo("/login?error=google_userinfo");
    }
    if (!info.email || info.email_verified !== true) {
      return redirectTo("/login?error=google_email_unverified");
    }

    // Existing identity → login; matching email → link; else provision.
    let user = await findIdentityUser("google", info.sub);
    if (!user && info.email) {
      const [byEmail] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, info.email))
        .limit(1);
      if (byEmail) user = byEmail;
    }
    if (!user) {
      const [created] = await db
        .insert(schema.users)
        .values({
          name: info.name ?? info.email,
          email: info.email,
          role: "citizen",
          approvalStatus: "approved",
        })
        .returning();
      user = created;
    }
    await linkIdentity(user.id, "google", info.sub);

    await createSession(c, user.id, {
      ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
      device: c.req.header("user-agent"),
    });

    return redirectTo("/");
  })

  /* ---------- Session ---------- */
  .get("/logout", requireAuth, async (c) => {
    await revokeCurrentSession(c);
    return c.json({ ok: true });
  });
