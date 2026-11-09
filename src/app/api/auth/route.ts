import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { desc, eq, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    await ensureSeeded();
    const body = await request.json();
    const { action } = body;

    if (action === "login") {
      const { email, password } = body;
      if (!email || !password) {
        return NextResponse.json(
          { error: "Email and password are required." },
          { status: 400 }
        );
      }

      const [customer] = await db
        .select()
        .from(customers)
        .where(eq(customers.email, String(email).trim().toLowerCase()));

      if (!customer || customer.passwordHash !== password) {
        return NextResponse.json(
          {
            error:
              "Invalid credentials. Try the demo account: samira@example.com / reshma2026",
          },
          { status: 401 }
        );
      }

      const customerOrders = await db
        .select()
        .from(orders)
        .where(
          or(
            eq(orders.customerId, customer.id),
            eq(orders.customerEmail, customer.email)
          )
        )
        .orderBy(desc(orders.createdAt));

      const { passwordHash: _pw, ...safeCustomer } = customer;
      return NextResponse.json({
        customer: safeCustomer,
        orders: customerOrders,
      });
    }

    if (action === "register") {
      const { name, email, phone, whatsapp, address, password } = body;
      if (!name || !email || !phone || !password) {
        return NextResponse.json(
          { error: "Name, email, phone, and password are required." },
          { status: 400 }
        );
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const [existing] = await db
        .select()
        .from(customers)
        .where(eq(customers.email, normalizedEmail));

      if (existing) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }

      const [created] = await db
        .insert(customers)
        .values({
          name: String(name).trim(),
          email: normalizedEmail,
          phone: String(phone).trim(),
          whatsapp: String(whatsapp || phone).trim(),
          address: String(address || "Dhaka, Bangladesh").trim(),
          passwordHash: String(password),
          measurementUnit: "inches",
          savedMeasurements: {},
        })
        .returning();

      const { passwordHash: _pw, ...safeCustomer } = created;
      return NextResponse.json(
        { customer: safeCustomer, orders: [] },
        { status: 201 }
      );
    }

    if (action === "updateProfile") {
      const {
        id,
        name,
        phone,
        whatsapp,
        address,
        savedMeasurements,
        measurementUnit,
      } = body;

      if (!id) {
        return NextResponse.json(
          { error: "Customer ID required" },
          { status: 400 }
        );
      }

      const [updated] = await db
        .update(customers)
        .set({
          name: name ? String(name).trim() : undefined,
          phone: phone ? String(phone).trim() : undefined,
          whatsapp: whatsapp ? String(whatsapp).trim() : undefined,
          address: address ? String(address).trim() : undefined,
          savedMeasurements: savedMeasurements ?? undefined,
          measurementUnit: measurementUnit ?? undefined,
        })
        .where(eq(customers.id, Number(id)))
        .returning();

      if (!updated) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        );
      }

      const customerOrders = await db
        .select()
        .from(orders)
        .where(
          or(
            eq(orders.customerId, updated.id),
            eq(orders.customerEmail, updated.email)
          )
        )
        .orderBy(desc(orders.createdAt));

      const { passwordHash: _pw, ...safeCustomer } = updated;
      return NextResponse.json({
        customer: safeCustomer,
        orders: customerOrders,
      });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/auth error:", error);
    return NextResponse.json(
      { error: "Authentication request failed" },
      { status: 500 }
    );
  }
}
