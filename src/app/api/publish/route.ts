import { NextRequest, NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { products, siteContent, storeSettings } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { requireAdmin } from "@/lib/adminAuth";
import { DEFAULT_CONTENT, isContentPageKey } from "@/lib/siteContent";

export const dynamic = "force-dynamic";

const MAX_FIELD_LENGTH = 5000;

type DraftCategory = "Three Piece" | "Two Piece" | "Tops";

function cleanCategory(value: unknown): DraftCategory {
  if (value === "Two Piece" || value === "Tops") return value;
  return "Three Piece";
}

function stringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value.map((item) => String(item).trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : fallback;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    await ensureSeeded();
    const body = await request.json();
    const content = body?.content;
    const settings = body?.settings;
    const productDraft = body?.products;
    const productItems: unknown[] | null = Array.isArray(productDraft)
      ? productDraft
      : Array.isArray(productDraft?.items)
      ? productDraft.items
      : null;
    const deletedIds: number[] = Array.isArray(productDraft?.deletedIds)
      ? productDraft.deletedIds
          .map((id: unknown) => Number(id))
          .filter((id: number) => Number.isInteger(id) && id > 0)
      : [];

    // 1. Page content — only known fields are accepted.
    if (content && typeof content === "object") {
      for (const [page, rawValues] of Object.entries(
        content as Record<string, unknown>
      )) {
        if (
          !isContentPageKey(page) ||
          !rawValues ||
          typeof rawValues !== "object"
        ) {
          continue;
        }
        const allowed = Object.keys(DEFAULT_CONTENT[page]);
        const clean: Record<string, string> = {};
        for (const field of allowed) {
          const value = (rawValues as Record<string, unknown>)[field];
          if (typeof value === "string") {
            clean[field] = value.trim().slice(0, MAX_FIELD_LENGTH);
          }
        }
        await db
          .insert(siteContent)
          .values({ key: page, value: clean, updatedAt: new Date() })
          .onConflictDoUpdate({
            target: siteContent.key,
            set: { value: clean, updatedAt: new Date() },
          });
      }
    }

    // 2. Store settings.
    if (settings && typeof settings === "object") {
      const [existing] = await db.select().from(storeSettings);
      if (existing) {
        const draft = settings as Record<string, unknown>;
        const text = (key: string, fallback: string) =>
          typeof draft[key] === "string" ? String(draft[key]) : fallback;
        const number = (key: string, fallback: number) => {
          const parsed = Number(draft[key]);
          return Number.isFinite(parsed) ? parsed : fallback;
        };

        await db
          .update(storeSettings)
          .set({
            brandName: text("brandName", existing.brandName),
            heroHeadline: text("heroHeadline", existing.heroHeadline),
            heroSubtext: text("heroSubtext", existing.heroSubtext),
            whatsappNumber: text("whatsappNumber", existing.whatsappNumber),
            contactEmail: text("contactEmail", existing.contactEmail),
            atelierAddress: text("atelierAddress", existing.atelierAddress),
            deliveryChargeInside: number(
              "deliveryChargeInside",
              existing.deliveryChargeInside
            ),
            deliveryChargeOutside: number(
              "deliveryChargeOutside",
              existing.deliveryChargeOutside
            ),
            bkashNumber: text("bkashNumber", existing.bkashNumber),
            bkashInstructions: text(
              "bkashInstructions",
              existing.bkashInstructions
            ),
            nagadNumber: text("nagadNumber", existing.nagadNumber),
            nagadInstructions: text(
              "nagadInstructions",
              existing.nagadInstructions
            ),
            instagramUrl: text("instagramUrl", existing.instagramUrl),
            facebookUrl: text("facebookUrl", existing.facebookUrl),
            updatedAt: new Date(),
          })
          .where(eq(storeSettings.id, existing.id));
      }
    }

    // 3. Catalogue — draft rows are upserted, and only ids the owner
    // explicitly removed are deleted from the live table.
    if (productItems) {
      const liveProducts = await db.select().from(products);
      const liveIds = new Set(liveProducts.map((p) => p.id));

      for (const raw of productItems) {
        if (!raw || typeof raw !== "object") continue;
        const item = raw as Record<string, unknown>;
        const name = String(item.name ?? "").trim();
        if (!name) continue;

        const category = cleanCategory(item.category);
        const isThreePiece = category === "Three Piece";
        const values = {
          name,
          category,
          price: Math.max(0, Number(item.price) || 0),
          stitchingFee: Math.max(
            0,
            Number(item.stitchingFee) || (isThreePiece ? 1400 : 850)
          ),
          description: String(item.description ?? ""),
          fabricDetails: String(item.fabricDetails ?? ""),
          careInstructions: String(item.careInstructions ?? ""),
          images: stringArray(item.images, [
            "/images/collection-three-piece.jpg",
          ]),
          colors: stringArray(item.colors, ["Warm Ivory", "Deep Wine"]),
          sizes: stringArray(
            item.sizes,
            isThreePiece
              ? ["Unstitched", "Custom Stitched"]
              : ["XS", "S", "M", "L", "XL", "Custom Tailored"]
          ),
          inStock: item.inStock !== false,
          stockCount: Math.max(0, Number(item.stockCount) || 0),
          featured: Boolean(item.featured),
          supportsUnstitched: isThreePiece,
          supportsCustomTailoring: true,
        };

        const id = Number(item.id);
        if (Number.isInteger(id) && id > 0 && liveIds.has(id)) {
          await db.update(products).set(values).where(eq(products.id, id));
        } else {
          const baseSlug = slugify(name) || "piece";
          let slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
          let attempt = 0;
          while (true) {
            const [duplicate] = await db
              .select({ id: products.id })
              .from(products)
              .where(eq(products.slug, slug));
            if (!duplicate) break;
            attempt += 1;
            slug = `${baseSlug}-${Date.now().toString().slice(-4)}-${attempt}`;
            if (attempt > 20) {
              slug = `${baseSlug}-${Math.random().toString(36).slice(2, 7)}`;
              break;
            }
          }
          await db.insert(products).values({ ...values, slug });
        }
      }

      const toDelete = deletedIds.filter((id) => liveIds.has(id));
      if (toDelete.length > 0) {
        await db.delete(products).where(inArray(products.id, toDelete));
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/publish error:", error);
    return NextResponse.json(
      { error: "Publishing failed. Please try again." },
      { status: 500 }
    );
  }
}
