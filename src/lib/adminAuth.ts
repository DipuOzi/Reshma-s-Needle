import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "rn_admin_session";
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

/**
 * The atelier access code. Override with ADMIN_ACCESS_CODE in the environment;
 * defaults to the code requested by the owner.
 */
function getAdminCode(): string {
  return process.env.ADMIN_ACCESS_CODE || "SAD1999";
}

/**
 * Secret used to sign session cookies. Set ADMIN_SESSION_SECRET in production.
 * The fallback is derived from the access code, so changing the code also
 * signs out every existing admin session.
 */
function getSessionSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    `reshmas-needle::${getAdminCode()}::${process.env.DATABASE_URL ?? ""}`
  );
}

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

function digest(value: string): Buffer {
  return createHmac("sha256", "rn-code-compare").update(value).digest();
}

/** Constant-time comparison of the submitted code against the access code. */
export function verifyAdminCode(input: string): boolean {
  return timingSafeEqual(digest(input.trim()), digest(getAdminCode()));
}

export function createAdminSessionToken(): string {
  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_SESSION_TTL_SECONDS;
  const payload = `admin.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [role, expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);
  if (role !== "admin" || !Number.isFinite(expiresAt)) return false;
  if (expiresAt < Math.floor(Date.now() / 1000)) return false;

  const expected = Buffer.from(sign(`${role}.${expiresAtRaw}`));
  const received = Buffer.from(signature);
  return (
    expected.length === received.length && timingSafeEqual(expected, received)
  );
}

export async function isAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_COOKIE)?.value);
}

/**
 * Use at the top of protected route handlers:
 *   const denied = await requireAdmin(); if (denied) return denied;
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  if (await isAdminSession()) return null;
  return NextResponse.json(
    { error: "Admin authentication required." },
    { status: 401 }
  );
}
