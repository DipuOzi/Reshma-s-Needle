import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import {
  applyProductDraft,
  normalizeProduct,
  sortProducts,
  readPublishedJson,
  commitJsonFile,
} from "@/lib/contentStore";
import { isGithubConfigured, readRepoJson } from "@/lib/github";
import type { ProductRecord } from "@/context/StoreContext";

export const dynamic = "force-dynamic";

const PRODUCTS_FILE = "content/products.json";

/** Map a legacy database row to the published JSON record shape. */
function rowDbToRecord(row: typeof products.$inferSelect): ProductRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category as ProductRecord["category"],
    price: row.price,
    stitchingFee: row.stitchingFee,
    description: row.description,
    fabricDetails: row.fabricDetails,
    careInstructions: row.careInstructions,
    images: row.images,
    colors: row.colors,
    sizes: row.sizes,
    inStock: row.inStock,
    stockCount: row.stockCount,
    featured: row.featured,
    supportsUnstitched: row.supportsUnstitched,
    supportsCustomTailoring: row.supportsCustomTailoring,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Live catalogue used by the storefront and the dashboard.
 * Priority: the published repo snapshot (updated by publishing) →
 * a short-cached GitHub fetch → the legacy database (first local run).
 */
async function loadCatalogue(): Promise<ProductRecord[] | null> {
  const published = await readPublishedJson<ProductRecord[]>(PRODUCTS_FILE);
  if (Array.isArray(published.data)) return sortProducts(published.data);

  if (isGithubConfigured()) {
    try {
      const remote = await readRepoJson<ProductRecord[]>(PRODUCTS_FILE);
      if (Array.isArray(remote)) return sortProducts(remote);
    } catch (error) {
      console.error("[products] repo read failed:", error);
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    let allProducts = await loadCatalogue();

    if (allProducts === null) {
      try {
        await ensureSeeded();
        const rows = await db.select().from(products);
        allProducts = sortProducts(
          rows.map(rowDbToRecord)
        );
      } catch (error) {
        console.error("GET /api/products: no catalogue source:", error);
        allProducts = [];
      }
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");

    let filtered = allProducts;
    if (category && category !== "All") {
      filtered = filtered.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );
    }
    if (featured === "true") {
      filtered = filtered.filter((p) => p.featured);
    }

    return NextResponse.json({ products: filtered });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 }
    );
  }
}

/**
 * Direct (bypass-draft) product creation. In GitHub mode this commits the
 * updated catalogue file; the dashboard's normal Save & Publish flow does a
 * full draft publish instead — both end up in content/products.json.
 */
export async function POST(request: NextRequest) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;
    const body = await request.json();
    const { name, category, price } = body;

    if (!name || !category || price === undefined) {
      return NextResponse.json(
        { error: "Name, category, and price are required." },
        { status: 400 }
      );
    }

    const fields = normalizeProduct({ ...body, category, name, price });

    if (isGithubConfigured()) {
      const current = await readRepoJson<ProductRecord[]>(PRODUCTS_FILE);
      const next = applyProductDraft(current ?? [], {
        items: [{ ...body, name, category, price, id: -Date.now() }],
        deletedIds: [],
      });
      await commitJsonFile(PRODUCTS_FILE, next, "Create product via product API");
      const created =
        next.length > (current?.length ?? 0) ? next[next.length - 1] : undefined;
      return NextResponse.json(
        created ? { product: created } : { ok: true },
        { status: 201 }
      );
    }

    // Legacy local-database fallback.
    await ensureSeeded();
    const base = fields.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const slug = `${base || "piece"}-${Date.now().toString().slice(-4)}`;
    const [created] = await db.insert(products).values({ ...fields, slug }).returning();

    return NextResponse.json({ product: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
