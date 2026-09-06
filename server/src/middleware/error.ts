import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ZodError } from "zod";

export type ApiError = { error: { code: string; message: string; details?: unknown } };

export function errorResponse(
  code: string,
  message: string,
  details?: unknown
): ApiError {
  return { error: { code, message, ...(details !== undefined ? { details } : {}) } };
}

/**
 * One error shape for every route: { error: { code, message, details? } }.
 * Registered with app.onError — Hono's supported way to catch handler errors.
 */
export async function onError(err: unknown, c: Context) {
  if (err instanceof ZodError) {
    return c.json(
      errorResponse(
        "VALIDATION_ERROR",
        "Invalid request payload",
        err.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
      ),
      400
    );
  }

  if (err instanceof HttpError) {
    return c.json(
      errorResponse(err.code, err.message, err.details),
      err.status as ContentfulStatusCode
    );
  }

  console.error("[unhandled]", err);
  return c.json(errorResponse("INTERNAL_ERROR", "Something went wrong"), 500);
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export const badRequest = (msg: string, details?: unknown) =>
  new HttpError(400, "BAD_REQUEST", msg, details);
export const unauthorized = (msg = "Authentication required") =>
  new HttpError(401, "UNAUTHORIZED", msg);
export const forbidden = (msg = "You do not have access to this resource") =>
  new HttpError(403, "FORBIDDEN", msg);
export const notFound = (msg = "Resource not found") =>
  new HttpError(404, "NOT_FOUND", msg);
export const conflict = (msg: string, details?: unknown) =>
  new HttpError(409, "CONFLICT", msg, details);
export const tooManyRequests = (msg = "Too many requests, try again later") =>
  new HttpError(429, "RATE_LIMITED", msg);
