import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/db";
import { customTailoringRequests } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { desc } from "drizzle-orm";
import { DATA_FILES, readLiveJson, commitJsonFile } from "@/lib/contentStore";
import { isGithubConfigured } from "@/lib/github";
import type { StoredTailoringRequest } from "@/lib/dataShapes";

export const dynamic = "force-dynamic";

async function loadRequests(): Promise<StoredTailoringRequest[]> {
  // Without a GitHub token (offline local dev) keep the legacy database pair
  // consistent: writes go to the DB, so reads come from it too.
  if (!isGithubConfigured()) {
    try {
      await ensureSeeded();
      const rows = await db
        .select()
        .from(customTailoringRequests)
        .orderBy(desc(customTailoringRequests.createdAt));
      return rows.map(dbRowToRequest);
    } catch {
      // fall through to the repo snapshot below
    }
  }
  const live = await readLiveJson<StoredTailoringRequest[]>(
    DATA_FILES.tailoring
  );
  if (Array.isArray(live.data)) {
    return [...live.data].sort((a, b) =>
      (b.createdAt || "").localeCompare(a.createdAt || "")
    );
  }
  try {
    await ensureSeeded();
    const rows = await db
      .select()
      .from(customTailoringRequests)
      .orderBy(desc(customTailoringRequests.createdAt));
    return rows.map(dbRowToRequest);
  } catch (error) {
    console.error("[tailoring] no source available:", error);
    return [];
  }
}

function dbRowToRequest(row: typeof customTailoringRequests.$inferSelect): StoredTailoringRequest {
  return {
    ...row,
    referenceImageData: row.referenceImageData ?? null,
    referenceImageName: row.referenceImageName ?? null,
    productImage: row.productImage ?? null,
    selectedColor: row.selectedColor ?? null,
    productId: row.productId ?? null,
    additionalInstructions: row.additionalInstructions ?? null,
    specialNotes: row.specialNotes ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET() {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;
    return NextResponse.json({ requests: await loadRequests() });
  } catch (error) {
    console.error("GET /api/tailoring error:", error);
    return NextResponse.json(
      { error: "Failed to fetch custom tailoring requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      category,
      productId,
      productName,
      productImage,
      selectedColor,
      tailoringOption,
      unit,
      measurements,
      referenceImageName,
      referenceImageData,
      specialNotes,
      customerName,
      whatsappNumber,
      deliveryAddress,
      additionalInstructions,
    } = body as Record<string, unknown>;

    if (
      !category ||
      !productName ||
      !customerName ||
      !whatsappNumber ||
      !deliveryAddress
    ) {
      return NextResponse.json(
        {
          error:
            "Please complete all required outfit, measurement, and customer contact fields.",
        },
        { status: 400 }
      );
    }

    const build = (existing: StoredTailoringRequest[]): StoredTailoringRequest => {
      const nextId =
        existing.reduce((max, r) => Math.max(max, r.id ?? 0), 0) + 1;
      const taken = new Set(existing.map((r) => r.requestNumber));
      let requestNumber = `BESP-2026-${Date.now().toString().slice(-6)}`;
      if (taken.has(requestNumber)) {
        requestNumber = `BESP-2026-${Date.now().toString().slice(-4)}-${nextId}`;
      }
      return {
        id: nextId,
        requestNumber,
        category: String(category),
        productId: productId ? Number(productId) : null,
        productName: String(productName),
        productImage: productImage ? String(productImage) : null,
        selectedColor: selectedColor ? String(selectedColor) : null,
        tailoringOption:
          typeof tailoringOption === "string" && tailoringOption
            ? tailoringOption
            : "Bespoke Custom Stitched",
        unit: unit === "cm" ? "cm" : "inches",
        measurements: (measurements ?? {}) as StoredTailoringRequest["measurements"],
        referenceImageName: referenceImageName ? String(referenceImageName) : null,
        // NOTE: kept as provided. The wizard already sends a data URI; large
        // images make this JSON file heavy — the endpoint caps its size below.
        referenceImageData: referenceImageData
          ? String(referenceImageData).slice(0, 700_000)
          : null,
        specialNotes: specialNotes ? String(specialNotes) : null,
        customerName: String(customerName).trim(),
        whatsappNumber: String(whatsappNumber).trim(),
        deliveryAddress: String(deliveryAddress).trim(),
        additionalInstructions: additionalInstructions
          ? String(additionalInstructions)
          : null,
        status: "New Request",
        createdAt: new Date().toISOString(),
      };
    };

    if (isGithubConfigured()) {
      const current = (
        await readLiveJson<StoredTailoringRequest[]>(DATA_FILES.tailoring)
      ).data;
      const list = Array.isArray(current) ? current : [];
      const created = build(list);
      const next = [...list, created];
      const result = await commitJsonFile(
        DATA_FILES.tailoring,
        next,
        `New tailoring request ${created.requestNumber} from ${created.customerName}`
      );
      if (result.committed || result.skipped) {
        return NextResponse.json({ request: created }, { status: 201 });
      }
      return NextResponse.json(
        { error: "Failed to save the request. Please try again." },
        { status: 502 }
      );
    }

    // Legacy local-database fallback.
    await ensureSeeded();
    const randomCode = Math.floor(100 + Math.random() * 900);
    const [created] = await db
      .insert(customTailoringRequests)
      .values({
        requestNumber: `BESP-2026-${randomCode}`,
        category: String(category),
        productId: productId ? Number(productId) : null,
        productName: String(productName),
        productImage: productImage ? String(productImage) : null,
        selectedColor: selectedColor ? String(selectedColor) : null,
        tailoringOption:
          typeof tailoringOption === "string" && tailoringOption
            ? tailoringOption
            : "Bespoke Custom Stitched",
        unit: unit === "cm" ? "cm" : "inches",
        measurements: (measurements ?? {}) as never,
        referenceImageName: referenceImageName ? String(referenceImageName) : null,
        referenceImageData: referenceImageData
          ? String(referenceImageData).slice(0, 700_000)
          : null,
        specialNotes: specialNotes ? String(specialNotes) : null,
        customerName: String(customerName).trim(),
        whatsappNumber: String(whatsappNumber).trim(),
        deliveryAddress: String(deliveryAddress).trim(),
        additionalInstructions: additionalInstructions
          ? String(additionalInstructions)
          : null,
        status: "New Request",
      })
      .returning();

    return NextResponse.json(
      { request: { ...created, createdAt: created.createdAt.toISOString() } },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/tailoring error:", error);
    return NextResponse.json(
      { error: "Failed to save custom tailoring request" },
      { status: 500 }
    );
  }
}
