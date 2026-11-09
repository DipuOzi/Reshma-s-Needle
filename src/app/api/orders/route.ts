import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await ensureSeeded();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId");
    const email = searchParams.get("email");

    // The full order book is only available to the authenticated atelier owner.
    if (!customerId && !email) {
      const denied = await requireAdmin();
      if (denied) return denied;
    }

    let allOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));

    if (customerId) {
      allOrders = allOrders.filter(
        (o) => o.customerId === Number(customerId)
      );
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
    await ensureSeeded();
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
    } = body;

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

    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `RN-2026-${randomDigits}`;

    const [created] = await db
      .insert(orders)
      .values({
        orderNumber,
        customerId: customerId ? Number(customerId) : null,
        customerName: String(customerName).trim(),
        customerEmail: customerEmail ? String(customerEmail).trim() : null,
        phone: String(phone).trim(),
        whatsapp: String(whatsapp).trim(),
        deliveryAddress: String(deliveryAddress).trim(),
        deliveryZone: deliveryZone || "Inside Dhaka",
        orderNotes: orderNotes || null,
        paymentMethod: paymentMethod || "Cash on Delivery",
        paymentTransactionId: paymentTransactionId || null,
        items,
        subtotal: Number(subtotal),
        deliveryCharge: Number(deliveryCharge),
        total: Number(total),
        status: "Pending",
      })
      .returning();

    return NextResponse.json({ order: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
