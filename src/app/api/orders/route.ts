import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { desc } from "drizzle-orm";
import { DATA_FILES, readLiveJson, commitJsonFile } from "@/lib/contentStore";
import { isGithubConfigured } from "@/lib/github";
import type { OrderItemPayload } from "@/db/schema";
import type { StoredOrder } from "@/lib/dataShapes";

export const dynamic = "force-dynamic";

/**
 * Orders persist as data/orders.json in the repository. Every new order and
 * every status change is one commit (which also refreshes the Vercel
 * deployment). The legacy database is only used when GitHub is not
 * configured (offline local development).
 */

async function loadOrders(): Promise<StoredOrder[]> {
  // Without a GitHub token (offline local dev) keep the legacy database pair
  // consistent: writes go to the DB, so reads come from it too.
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
    console.error("[orders] no source available:", error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const email = searchParams.get("email");

    // The full order book is only available to the authenticated atelier owner.
    if (!customerId && !email) {
      const denied = await requireAdmin();
      if (denied) return denied;
    }

    let allOrders = await loadOrders();

    if (customerId) {
      allOrders = allOrders.filter((o) => o.customerId === Number(customerId));
    } else if (email) {
      allOrders = allOrders.filter(
        (o) => o.customerEmail?.toLowerCase() === email.toLowerCase()
      );
    }

    return NextResponse.json({ orders: allOrders });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to load orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      customerId,
      customerName,
      customerEmail,
      phone,
      whatsapp,
      deliveryAddress,
      deliveryZone,
      orderNotes,
      paymentMethod,
      paymentTransactionId,
      items,
      subtotal,
      deliveryCharge,
      total,
    } = body as Record<string, unknown>;

    if (
      !customerName ||
      !phone ||
      !whatsapp ||
      !deliveryAddress ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Please provide your name, phone, WhatsApp number, delivery address, and at least one item.",
        },
        { status: 400 }
      );
    }

    const newOrder = (existing: StoredOrder[]): StoredOrder => {
      const nextId =
        existing.reduce((max, o) => Math.max(max, o.id ?? 0), 0) + 1;
      const takenNumbers = new Set(existing.map((o) => o.orderNumber));
      let orderNumber = `RN-2026-${Date.now().toString().slice(-6)}`;
      if (takenNumbers.has(orderNumber)) {
        orderNumber = `RN-2026-${Date.now().toString().slice(-4)}-${nextId}`;
      }
      return {
        id: nextId,
        orderNumber,
        customerId: customerId ? Number(customerId) : null,
        customerName: String(customerName).trim(),
        customerEmail: customerEmail ? String(customerEmail).trim() : null,
        phone: String(phone).trim(),
        whatsapp: String(whatsapp).trim(),
        deliveryAddress: String(deliveryAddress).trim(),
        deliveryZone:
          typeof deliveryZone === "string" && deliveryZone
            ? deliveryZone
            : "Inside Dhaka",
        orderNotes: orderNotes ? String(orderNotes) : null,
        paymentMethod:
          typeof paymentMethod === "string" && paymentMethod
            ? paymentMethod
            : "Cash on Delivery",
        paymentTransactionId: paymentTransactionId
          ? String(paymentTransactionId)
          : null,
        items: items as OrderItemPayload[],
        subtotal: Number(subtotal) || 0,
        deliveryCharge: Number(deliveryCharge) || 0,
        total: Number(total) || 0,
        status: "Pending",
        createdAt: new Date().toISOString(),
      };
    };

    if (isGithubConfigured()) {
      const current = (await readLiveJson<StoredOrder[]>(DATA_FILES.orders))
        .data;
      const list = Array.isArray(current) ? current : [];
      const created = newOrder(list);
      const next = [...list, created];
      const result = await commitJsonFile(
        DATA_FILES.orders,
        next,
        `New order ${created.orderNumber} from ${created.customerName}`
      );
      if (result.committed || result.skipped) {
        return NextResponse.json({ order: created }, { status: 201 });
      }
      return NextResponse.json(
        { error: "Failed to record the order. Please try again." },
        { status: 502 }
      );
    }

    // Legacy local-database fallback.
    await ensureSeeded();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const [created] = await db
      .insert(orders)
      .values({
        orderNumber: `RN-2026-${randomDigits}`,
        customerId: customerId ? Number(customerId) : null,
        customerName: String(customerName).trim(),
        customerEmail: customerEmail ? String(customerEmail).trim() : null,
        phone: String(phone).trim(),
        whatsapp: String(whatsapp).trim(),
        deliveryAddress: String(deliveryAddress).trim(),
        deliveryZone: typeof deliveryZone === "string" && deliveryZone ? deliveryZone : "Inside Dhaka",
        orderNotes: orderNotes ? String(orderNotes) : null,
        paymentMethod:
          typeof paymentMethod === "string" && paymentMethod
            ? paymentMethod
            : "Cash on Delivery",
        paymentTransactionId: paymentTransactionId
          ? String(paymentTransactionId)
          : null,
        items: items as OrderItemPayload[],
        subtotal: Number(subtotal) || 0,
        deliveryCharge: Number(deliveryCharge) || 0,
        total: Number(total) || 0,
        status: "Pending",
      })
      .returning();

    return NextResponse.json(
      {
        order: {
          ...created,
          createdAt: created.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
