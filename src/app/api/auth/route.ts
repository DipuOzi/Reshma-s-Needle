import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { desc, eq, or } from "drizzle-orm";
import { DATA_FILES, readLiveJson, commitJsonFile } from "@/lib/contentStore";
import { isGithubConfigured } from "@/lib/github";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { StoredCustomer, StoredOrder } from "@/lib/dataShapes";

export const dynamic = "force-dynamic";

/**
 * Customer accounts persist as data/customers.json in the repository.
 * Passwords are salted scrypt hashes; legacy plain-text rows are verified
 * for backwards compatibility. The legacy database is only consulted when
 * GitHub is not configured (offline local development).
 */

function safeCustomer(customer: StoredCustomer) {
  const { passwordHash: _omitted, ...rest } = customer;
  void _omitted;
  return rest;
}

async function loadCustomers(): Promise<StoredCustomer[]> {
  // Without a GitHub token (offline local dev) keep the legacy database pair
  // consistent: writes go to the DB, so reads come from it too.
  if (!isGithubConfigured()) {
    try {
      await ensureSeeded();
      return await loadCustomersFromDb();
    } catch {
      // fall through to the repo snapshot below
    }
  }
  const live = await readLiveJson<StoredCustomer[]>(DATA_FILES.customers);
  if (Array.isArray(live.data)) return live.data;
  try {
    return await loadCustomersFromDb();
  } catch (error) {
    console.error("[customers] no source available:", error);
    return [];
  }
}

async function loadCustomersFromDb(): Promise<StoredCustomer[]> {
  await ensureSeeded();
  const rows = await db
    .select()
    .from(customers)
    .orderBy(desc(customers.createdAt));
  return rows.map((row) => ({
    ...row,
    savedMeasurements: row.savedMeasurements ?? undefined,
    measurementUnit:
      (row.measurementUnit as StoredCustomer["measurementUnit"]) ?? "inches",
    createdAt: row.createdAt.toISOString(),
  }));
}

async function loadOrdersForCustomer(
  customer: StoredCustomer
): Promise<StoredOrder[]> {
  const result = (
    await readLiveJson<StoredOrder[]>(DATA_FILES.orders)
  ).data;
  if (Array.isArray(result)) {
    return result
      .filter(
        (o) =>
          o.customerId === customer.id ||
          (o.customerEmail &&
            o.customerEmail.toLowerCase() === customer.email.toLowerCase())
      )
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  }
  try {
    await ensureSeeded();
    const rows = await db
      .select()
      .from(orders)
      .where(
        or(
          eq(orders.customerId, customer.id),
          eq(orders.customerEmail, customer.email)
        )
      )
      .orderBy(desc(orders.createdAt));
    return rows.map((row) => ({
      ...row,
      customerId: row.customerId ?? null,
      customerEmail: row.customerEmail ?? null,
      orderNotes: row.orderNotes ?? null,
      paymentTransactionId: row.paymentTransactionId ?? null,
      createdAt: row.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body as { action?: string };

    if (action === "login") {
      const { email, password } = body as { email?: string; password?: string };
      if (!email || !password) {
        return NextResponse.json(
          { error: "Email and password are required." },
          { status: 400 }
        );
      }
      const normalizedEmail = email.trim().toLowerCase();
      const customer = (await loadCustomers()).find(
        (c) => c.email.toLowerCase() === normalizedEmail
      );

      if (!customer || !verifyPassword(String(password), customer.passwordHash)) {
        return NextResponse.json(
          {
            error:
              "Invalid credentials. Try the demo account: samira@example.com / reshma2026",
          },
          { status: 401 }
        );
      }

      return NextResponse.json({
        customer: safeCustomer(customer),
        orders: await loadOrdersForCustomer(customer),
      });
    }

    if (action === "register") {
      const { name, email, phone, whatsapp, address, password } = body as Record<
        string,
        string | undefined
      >;
      if (!name || !email || !phone || !password) {
        return NextResponse.json(
          { error: "Name, email, phone, and password are required." },
          { status: 400 }
        );
      }
      const normalizedEmail = email.trim().toLowerCase();

      const existing = (await loadCustomers()).find(
        (c) => c.email.toLowerCase() === normalizedEmail
      );
      if (existing) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 }
        );
      }

      const buildCustomer = (list: StoredCustomer[]): StoredCustomer => ({
        id: list.reduce((max, c) => Math.max(max, c.id ?? 0), 0) + 1,
        name: String(name).trim(),
        email: normalizedEmail,
        phone: String(phone).trim(),
        whatsapp: String(whatsapp || phone).trim(),
        address: String(address || "Dhaka, Bangladesh").trim(),
        passwordHash: hashPassword(String(password)),
        measurementUnit: "inches",
        savedMeasurements: {},
        createdAt: new Date().toISOString(),
      });

      if (isGithubConfigured()) {
        const list = await loadCustomers();
        // Re-check duplicates against the freshest list.
        if (list.find((c) => c.email.toLowerCase() === normalizedEmail)) {
          return NextResponse.json(
            { error: "An account with this email already exists." },
            { status: 409 }
          );
        }
        const created = buildCustomer(list);
        const result = await commitJsonFile(
          DATA_FILES.customers,
          [...list, created],
          `Register customer account ${created.email}`
        );
        if (!result.committed && !result.skipped) {
          return NextResponse.json(
            { error: "Failed to create the account. Please try again." },
            { status: 502 }
          );
        }
        return NextResponse.json(
          { customer: safeCustomer(created), orders: [] },
          { status: 201 }
        );
      }

      // Legacy local-database fallback.
      await ensureSeeded();
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

      const { passwordHash: _pw, ...safe } = created;
      void _pw;
      return NextResponse.json(
        {
          customer: {
            ...safe,
            measurementUnit: (safe.measurementUnit as "inches" | "cm") ?? "inches",
            createdAt: safe.createdAt.toISOString(),
          },
          orders: [],
        },
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
      } = body as Record<string, unknown>;

      if (!id) {
        return NextResponse.json(
          { error: "Customer ID required" },
          { status: 400 }
        );
      }

      const numericId = Number(id);

      const patchCustomer = (customer: StoredCustomer): StoredCustomer => ({
        ...customer,
        name: name ? String(name).trim() : customer.name,
        phone: phone ? String(phone).trim() : customer.phone,
        whatsapp: whatsapp ? String(whatsapp).trim() : customer.whatsapp,
        address: address ? String(address).trim() : customer.address,
        savedMeasurements:
          savedMeasurements !== undefined
            ? (savedMeasurements as StoredCustomer["savedMeasurements"])
            : customer.savedMeasurements,
        measurementUnit:
          measurementUnit === "cm" || measurementUnit === "inches"
            ? measurementUnit
            : customer.measurementUnit,
      });

      if (isGithubConfigured()) {
        const list = await loadCustomers();
        const index = list.findIndex((c) => c.id === numericId);
        if (index < 0) {
          return NextResponse.json(
            { error: "Customer not found" },
            { status: 404 }
          );
        }
        const updated = patchCustomer(list[index]);
        const next = [...list];
        next[index] = updated;
        const result = await commitJsonFile(
          DATA_FILES.customers,
          next,
          `Update customer profile ${updated.email}`
        );
        if (!result.committed && !result.skipped) {
          return NextResponse.json(
            { error: "Failed to update the profile. Please try again." },
            { status: 502 }
          );
        }
        return NextResponse.json({
          customer: safeCustomer(updated),
          orders: await loadOrdersForCustomer(updated),
        });
      }

      // Legacy local-database fallback.
      await ensureSeeded();
      const [dbUpdated] = await db
        .update(customers)
        .set({
          name: name ? String(name).trim() : undefined,
          phone: phone ? String(phone).trim() : undefined,
          whatsapp: whatsapp ? String(whatsapp).trim() : undefined,
          address: address ? String(address).trim() : undefined,
          savedMeasurements: savedMeasurements as never,
          measurementUnit:
            measurementUnit === "cm" || measurementUnit === "inches"
              ? measurementUnit
              : undefined,
        })
        .where(eq(customers.id, numericId))
        .returning();

      if (!dbUpdated) {
        return NextResponse.json(
          { error: "Customer not found" },
          { status: 404 }
        );
      }

      const customer: StoredCustomer = {
        ...dbUpdated,
        savedMeasurements: dbUpdated.savedMeasurements ?? undefined,
        measurementUnit:
          (dbUpdated.measurementUnit as StoredCustomer["measurementUnit"]) ??
          "inches",
        createdAt: dbUpdated.createdAt.toISOString(),
      };
      return NextResponse.json({
        customer: safeCustomer(customer),
        orders: await loadOrdersForCustomer(customer),
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
