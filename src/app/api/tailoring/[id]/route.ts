import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/db";
import { customTailoringRequests } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;
    await ensureSeeded();
    const { id } = await context.params;
    const numericId = Number(id);
    const body = await request.json();

    const [updated] = await db
      .update(customTailoringRequests)
      .set({
        status: body.status,
      })
      .where(eq(customTailoringRequests.id, numericId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Tailoring request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ request: updated });
  } catch (error) {
    console.error("PATCH /api/tailoring/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update request status" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;
    await ensureSeeded();
    const { id } = await context.params;
    const numericId = Number(id);

    await db
      .delete(customTailoringRequests)
      .where(eq(customTailoringRequests.id, numericId));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/tailoring/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete tailoring request" },
      { status: 500 }
    );
  }
}
