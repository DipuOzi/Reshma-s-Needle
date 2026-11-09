import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/db";
import { storeSettings } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeeded();
    const [settings] = await db.select().from(storeSettings);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to load store settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;
    await ensureSeeded();
    const body = await request.json();
    const [existing] = await db.select().from(storeSettings);

    if (!existing) {
      return NextResponse.json(
        { error: "Settings record not initialized" },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(storeSettings)
      .set({
        brandName: body.brandName ?? existing.brandName,
        heroHeadline: body.heroHeadline ?? existing.heroHeadline,
        heroSubtext: body.heroSubtext ?? existing.heroSubtext,
        whatsappNumber: body.whatsappNumber ?? existing.whatsappNumber,
        contactEmail: body.contactEmail ?? existing.contactEmail,
        atelierAddress: body.atelierAddress ?? existing.atelierAddress,
        deliveryChargeInside:
          body.deliveryChargeInside !== undefined
            ? Number(body.deliveryChargeInside)
            : existing.deliveryChargeInside,
        deliveryChargeOutside:
          body.deliveryChargeOutside !== undefined
            ? Number(body.deliveryChargeOutside)
            : existing.deliveryChargeOutside,
        bkashNumber: body.bkashNumber ?? existing.bkashNumber,
        bkashInstructions: body.bkashInstructions ?? existing.bkashInstructions,
        nagadNumber: body.nagadNumber ?? existing.nagadNumber,
        nagadInstructions: body.nagadInstructions ?? existing.nagadInstructions,
        instagramUrl: body.instagramUrl ?? existing.instagramUrl,
        facebookUrl: body.facebookUrl ?? existing.facebookUrl,
        updatedAt: new Date(),
      })
      .where(eq(storeSettings.id, existing.id))
      .returning();

    return NextResponse.json({ settings: updated });
  } catch (error) {
    console.error("PUT /api/settings error:", error);
    return NextResponse.json(
      { error: "Failed to update store settings" },
      { status: 500 }
    );
  }
}
