import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { eq } from "drizzle-orm";
import { DATA_FILES, readLiveJson, commitJsonFile } from "@/lib/contentStore";
import { isGithubConfigured } from "@/lib/github";
import type { StoredOrder } from "@/lib/dataShapes";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const { id } = await context.params;
    const numericId = Number(id);
    const body = await request.json();
    const status = typeof body?.status === "string" ? body.status : null;

    if (!status) {
      return NextResponse.json(
        { error: "A status is required." },
        { status: 400 }
      );
    }

    if (isGithubConfigured()) {
      const current = (await readLiveJson<StoredOrder[]>(DATA_FILES.orders))
        .data;
      const list = Array.isArray(current) ? current : [];
      const index = list.findIndex(
        (o) => o.id === numericId || o.orderNumber === id
      );
      if (index < 0) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }
      const next = [...list];
      next[index] = { ...next[index], status };
      const result = await commitJsonFile(
        DATA_FILES.orders,
        next,
        `Update order ${next[index].orderNumber} status to ${status}`
      );
      return NextResponse.json({ order: next[index], committed: result.committed });
    }

    // Legacy local-database fallback.
    await ensureSeeded();
    const [updated] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, numericId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      order: { ...updated, createdAt: updated.createdAt.toISOString() },
    });
  } catch (error) {
    console.error("PATCH /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
