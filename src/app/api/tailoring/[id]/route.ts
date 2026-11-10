import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/db";
import { customTailoringRequests } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { eq } from "drizzle-orm";
import { DATA_FILES, readLiveJson, commitJsonFile } from "@/lib/contentStore";
import { isGithubConfigured } from "@/lib/github";
import type { StoredTailoringRequest } from "@/lib/dataShapes";

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
      const current = (
        await readLiveJson<StoredTailoringRequest[]>(DATA_FILES.tailoring)
      ).data;
      const list = Array.isArray(current) ? current : [];
      const index = list.findIndex(
        (r) => r.id === numericId || r.requestNumber === id
      );
      if (index < 0) {
        return NextResponse.json(
          { error: "Tailoring request not found" },
          { status: 404 }
        );
      }
      const next = [...list];
      next[index] = { ...next[index], status };
      const result = await commitJsonFile(
        DATA_FILES.tailoring,
        next,
        `Update tailoring request ${next[index].requestNumber} status to ${status}`
      );
      return NextResponse.json({
        request: next[index],
        committed: result.committed,
      });
    }

    // Legacy local-database fallback.
    await ensureSeeded();
    const [updated] = await db
      .update(customTailoringRequests)
      .set({ status })
      .where(eq(customTailoringRequests.id, numericId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Tailoring request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      request: { ...updated, createdAt: updated.createdAt.toISOString() },
    });
  } catch (error) {
    console.error("PATCH /api/tailoring/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update request status" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    void request;
    const denied = await requireAdmin();
    if (denied) return denied;

    const { id } = await context.params;
    const numericId = Number(id);

    if (isGithubConfigured()) {
      const current = (
        await readLiveJson<StoredTailoringRequest[]>(DATA_FILES.tailoring)
      ).data;
      const list = Array.isArray(current) ? current : [];
      const target = list.find(
        (r) => r.id === numericId || r.requestNumber === id
      );
      if (!target) {
        return NextResponse.json(
          { error: "Tailoring request not found" },
          { status: 404 }
        );
      }
      const next = list.filter((r) => r !== target);
      const result = await commitJsonFile(
        DATA_FILES.tailoring,
        next,
        `Delete tailoring request ${target.requestNumber}`
      );
      return NextResponse.json({ ok: true, committed: result.committed });
    }

    // Legacy local-database fallback.
    await ensureSeeded();
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
