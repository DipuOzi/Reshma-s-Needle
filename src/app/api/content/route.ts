import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { siteContent } from "@/db/schema";
import { requireAdmin } from "@/lib/adminAuth";
import { getSiteContent } from "@/lib/serverData";
import { DEFAULT_CONTENT, isContentPageKey } from "@/lib/siteContent";

export const dynamic = "force-dynamic";

const MAX_FIELD_LENGTH = 5000;

export async function GET() {
  const content = await getSiteContent();
  return NextResponse.json({ content });
}

export async function PUT(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const { page, values } = body ?? {};

    if (!isContentPageKey(page) || typeof values !== "object" || !values) {
      return NextResponse.json(
        { error: "Unknown page or invalid content." },
        { status: 400 }
      );
    }

    // Only accept known fields for this page, as trimmed strings.
    const allowed = Object.keys(DEFAULT_CONTENT[page]);
    const clean: Record<string, string> = {};
    for (const field of allowed) {
      const value = (values as Record<string, unknown>)[field];
      if (typeof value === "string") {
        clean[field] = value.trim().slice(0, MAX_FIELD_LENGTH);
      }
    }

    await db
      .insert(siteContent)
      .values({ key: page, value: clean, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: siteContent.key,
        set: { value: clean, updatedAt: new Date() },
      });

    const content = await getSiteContent();
    return NextResponse.json({ content });
  } catch (error) {
    console.error("PUT /api/content error:", error);
    return NextResponse.json(
      { error: "Failed to save page content." },
      { status: 500 }
    );
  }
}
