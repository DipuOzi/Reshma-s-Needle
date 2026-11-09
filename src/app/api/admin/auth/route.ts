import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSessionToken,
  isAdminSession,
  verifyAdminCode,
} from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

const globalForAttempts = globalThis as typeof globalThis & {
  __rnAdminAttempts?: Map<string, { count: number; firstAt: number }>;
};
const attempts =
  globalForAttempts.__rnAdminAttempts ??
  (globalForAttempts.__rnAdminAttempts = new Map());

function clientKey(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function GET() {
  return NextResponse.json({ authenticated: await isAdminSession() });
}

export async function POST(request: NextRequest) {
  const key = clientKey(request);
  const now = Date.now();
  const record = attempts.get(key);

  if (record && now - record.firstAt > LOCKOUT_MS) {
    attempts.delete(key);
  } else if (record && record.count >= MAX_ATTEMPTS) {
    const minutes = Math.ceil((LOCKOUT_MS - (now - record.firstAt)) / 60000);
    return NextResponse.json(
      {
        error: `Too many incorrect attempts. Please try again in ${minutes} minute${
          minutes === 1 ? "" : "s"
        }.`,
      },
      { status: 429 }
    );
  }

  let code = "";
  try {
    const body = await request.json();
    code = typeof body?.code === "string" ? body.code : "";
  } catch {
    // fall through to validation error
  }

  if (!code.trim()) {
    return NextResponse.json(
      { error: "Please enter the atelier access code." },
      { status: 400 }
    );
  }

  if (!verifyAdminCode(code)) {
    const current = attempts.get(key);
    const next = current
      ? { count: current.count + 1, firstAt: current.firstAt }
      : { count: 1, firstAt: now };
    attempts.set(key, next);
    const remaining = Math.max(0, MAX_ATTEMPTS - next.count);
    return NextResponse.json(
      {
        error:
          remaining > 0
            ? `Incorrect access code. ${remaining} attempt${
                remaining === 1 ? "" : "s"
              } remaining.`
            : "Too many incorrect attempts. Please try again in 15 minutes.",
      },
      { status: 401 }
    );
  }

  attempts.delete(key);
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(ADMIN_COOKIE, createAdminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}
