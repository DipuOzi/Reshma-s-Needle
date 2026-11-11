import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { desc } from "drizzle-orm";
import { DATA_FILES, readLiveJson } from "@/lib/contentStore";
import { isGithubConfigured } from "@/lib/github";
import type { StoredOrder } from "@/lib/dataShapes";

export const dynamic = "force-dynamic";

/**
 * Registered client accounts live in the database. Order statistics are
 * aggregated from the same source /api/orders uses (repo JSON when GitHub is
 * configured, database otherwise), matched to accounts by email.
 */

async function loadOrders(): Promise<StoredOrder[]> {
  if (!isGithubConfigured()) {
    try {
      await ensureSeeded();
      const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
      return rows.map((row) => ({
        ...row,
        paymentTransactionId: row.paymentTransactionId ?? null,
        customerEmail: row.customerEmail ?? null,
        orderNotes: row.orderNotes ?? null,
        customerId: row.customerId ?? null,
        createdAt: row.createdAt.toISOString(),
      }));
    } catch {
      // fall through to the repo snapshot below
    }
  }
  const live = await readLiveJson<StoredOrder[]>(DATA_FILES.orders);
  if (Array.isArray(live.data)) {
    return [...live.data].sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || "")
    );
  }
  try {
    await ensureSeeded();
    const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
    return rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("[customers] order stats unavailable:", error);
    return [];
  }
}

export async function GET() {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    await ensureSeeded();
    const rows = await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        whatsapp: customers.whatsapp,
        address: customers.address,
        savedMeasurements: customers.savedMeasurements,
        createdAt: customers.createdAt,
      })
      .from(customers)
      .orderBy(desc(customers.createdAt));

    // Aggregate order history per account (matched by email).
    const allOrders = await loadOrders();
    const stats = new Map<
      string,
      { count: number; totalSpent: number; lastOrderAt: string | null }
    >();
    for (const order of allOrders) {
      if (!order.customerEmail) continue;
      const key = order.customerEmail.toLowerCase();
      const agg =
        stats.get(key) ?? { count: 0, totalSpent: 0, lastOrderAt: null };
      agg.count += 1;
      agg.totalSpent += order.total ?? 0;
      if (!agg.lastOrderAt || (order.createdAt ?? "") > agg.lastOrderAt) {
        agg.lastOrderAt = order.createdAt ?? null;
      }
      stats.set(key, agg);
    }

    return NextResponse.json({
      customers: rows.map((row) => {
        const agg = stats.get(row.email.toLowerCase());
        return {
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          whatsapp: row.whatsapp,
          address: row.address,
          createdAt: row.createdAt.toISOString(),
          hasSavedMeasurements:
            !!row.savedMeasurements &&
            Object.keys(row.savedMeasurements).length > 0,
          orderCount: agg?.count ?? 0,
          totalSpent: agg?.totalSpent ?? 0,
          lastOrderAt: agg?.lastOrderAt ?? null,
        };
      }),
    });
  } catch (error) {
    console.error("GET /api/customers error:", error);
    return NextResponse.json(
      { error: "Failed to load customer accounts" },
      { status: 500 }
    );
  }
}
