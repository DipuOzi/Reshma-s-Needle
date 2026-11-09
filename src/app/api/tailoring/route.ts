import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/db";
import { customTailoringRequests } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;
    await ensureSeeded();
    const requests = await db
      .select()
      .from(customTailoringRequests)
      .orderBy(desc(customTailoringRequests.createdAt));

    return NextResponse.json({ requests });
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
    await ensureSeeded();
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
    } = body;

    if (!category || !productName || !customerName || !whatsappNumber || !deliveryAddress) {
      return NextResponse.json(
        {
          error:
            "Please complete all required outfit, measurement, and customer contact fields.",
        },
        { status: 400 }
      );
    }

    const randomCode = Math.floor(100 + Math.random() * 900);
    const requestNumber = `BESP-2026-${randomCode}`;

    const [created] = await db
      .insert(customTailoringRequests)
      .values({
        requestNumber,
        category,
        productId: productId ? Number(productId) : null,
        productName,
        productImage: productImage || null,
        selectedColor: selectedColor || null,
        tailoringOption: tailoringOption || "Bespoke Custom Stitched",
        unit: unit === "cm" ? "cm" : "inches",
        measurements: measurements || {},
        referenceImageName: referenceImageName || null,
        referenceImageData: referenceImageData || null,
        specialNotes: specialNotes || null,
        customerName: String(customerName).trim(),
        whatsappNumber: String(whatsappNumber).trim(),
        deliveryAddress: String(deliveryAddress).trim(),
        additionalInstructions: additionalInstructions || null,
        status: "New Request",
      })
      .returning();

    return NextResponse.json({ request: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tailoring error:", error);
    return NextResponse.json(
      { error: "Failed to save custom tailoring request" },
      { status: 500 }
    );
  }
}
