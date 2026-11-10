import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/db";
import { storeSettings } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { eq } from "drizzle-orm";
import { readPublishedJson, readLiveJson, commitJsonFile } from "@/lib/contentStore";
import { isGithubConfigured } from "@/lib/github";
import type { StoreSettingsRecord } from "@/context/StoreContext";

export const dynamic = "force-dynamic";

const SETTINGS_FILE = "content/settings.json";

function loadFromDb(): Promise<StoreSettingsRecord | null> {
  return (async () => {
    try {
      await ensureSeeded();
      const [row] = await db.select().from(storeSettings);
      if (!row) return null;
      return {
        id: row.id,
        brandName: row.brandName,
        heroHeadline: row.heroHeadline,
        heroSubtext: row.heroSubtext,
        whatsappNumber: row.whatsappNumber,
        contactEmail: row.contactEmail,
        atelierAddress: row.atelierAddress,
        deliveryChargeInside: row.deliveryChargeInside,
        deliveryChargeOutside: row.deliveryChargeOutside,
        bkashNumber: row.bkashNumber,
        bkashInstructions: row.bkashInstructions,
        nagadNumber: row.nagadNumber,
        nagadInstructions: row.nagadInstructions,
        instagramUrl: row.instagramUrl,
        facebookUrl: row.facebookUrl,
      };
    } catch {
      return null;
    }
  })();
}

export async function GET() {
  try {
    const published = await readPublishedJson<StoreSettingsRecord>(SETTINGS_FILE);
    if (published.data && typeof published.data.brandName === "string") {
      return NextResponse.json({
        settings: { ...published.data, id: published.data.id ?? 1 },
      });
    }
    const settings = await loadFromDb();
    if (settings) return NextResponse.json({ settings });
    return NextResponse.json({ settings: null });
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
    const body = await request.json();

    if (isGithubConfigured()) {
      const current = (await readLiveJson<StoreSettingsRecord>(SETTINGS_FILE)).data;
      const settings = await loadFromDb();
      const base =
        (current && typeof current.brandName === "string"
          ? { ...current, id: 1 }
          : settings ?? null) as StoreSettingsRecord | null;
      if (!base) {
        return NextResponse.json(
          { error: "Settings record not initialized" },
          { status: 404 }
        );
      }
      const merged: StoreSettingsRecord = {
        ...base,
        brandName: body.brandName ?? base.brandName,
        heroHeadline: body.heroHeadline ?? base.heroHeadline,
        heroSubtext: body.heroSubtext ?? base.heroSubtext,
        whatsappNumber: body.whatsappNumber ?? base.whatsappNumber,
        contactEmail: body.contactEmail ?? base.contactEmail,
        atelierAddress: body.atelierAddress ?? base.atelierAddress,
        deliveryChargeInside:
          body.deliveryChargeInside !== undefined
            ? Number(body.deliveryChargeInside)
            : base.deliveryChargeInside,
        deliveryChargeOutside:
          body.deliveryChargeOutside !== undefined
            ? Number(body.deliveryChargeOutside)
            : base.deliveryChargeOutside,
        bkashNumber: body.bkashNumber ?? base.bkashNumber,
        bkashInstructions: body.bkashInstructions ?? base.bkashInstructions,
        nagadNumber: body.nagadNumber ?? base.nagadNumber,
        nagadInstructions: body.nagadInstructions ?? base.nagadInstructions,
        instagramUrl: body.instagramUrl ?? base.instagramUrl,
        facebookUrl: body.facebookUrl ?? base.facebookUrl,
      };
      const result = await commitJsonFile(
        SETTINGS_FILE,
        merged,
        "Update store settings via settings API"
      );
      return NextResponse.json({
        settings: merged,
        committed: result.committed,
      });
    }

    // Legacy local-database fallback.
    await ensureSeeded();
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
