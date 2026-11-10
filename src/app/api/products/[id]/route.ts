import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { eq, or } from "drizzle-orm";
import {
  sortProducts,
  normalizeProduct,
  readPublishedJson,
  commitJsonFile,
} from "@/lib/contentStore";
import { isGithubConfigured, readRepoJson } from "@/lib/github";
import type { ProductRecord } from "@/context/StoreContext";

export const dynamic = "force-dynamic";

const PRODUCTS_FILE = "content/products.json";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const numericId = Number(id);

    // Published catalogue first.
    const published = await readPublishedJson<ProductRecord[]>(PRODUCTS_FILE);
    if (Array.isArray(published.data)) {
      const match = published.data.find(
        (p) =>
          p.slug === id ||
          (!Number.isNaN(numericId) && p.id === numericId)
      );
      if (match) return NextResponse.json({ product: match });
      // Catalogue exists but product is not in it — do not fall back to a
      // staler database copy that may hold deleted products.
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await ensureSeeded();
    const condition = !Number.isNaN(numericId)
      ? or(eq(products.id, numericId), eq(products.slug, id))
      : eq(products.slug, id);

    const [product] = await db.select().from(products).where(condition);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;
    const { id } = await context.params;
    const numericId = Number(id);
    const body = await request.json();

    if (isGithubConfigured()) {
      const current = await readRepoJson<ProductRecord[]>(PRODUCTS_FILE);
      if (Array.isArray(current)) {
        const index = current.findIndex(
          (p) => p.id === numericId || p.slug === id
        );
        if (index < 0) {
          return NextResponse.json(
            { error: "Product not found" },
            { status: 404 }
          );
        }
        const fields = normalizeProduct({
          ...current[index],
          ...body,
          name: body.name ?? current[index].name,
        });
        const next = [...current];
        next[index] = { ...current[index], ...fields };
        await commitJsonFile(PRODUCTS_FILE, next, "Update product via product API");
        return NextResponse.json({ product: next[index] });
      }
    }

    // Legacy local-database fallback.
    await ensureSeeded();
    const updatePayload: Partial<typeof products.$inferInsert> = {};
    if (body.name !== undefined) updatePayload.name = String(body.name).trim();
    if (body.category !== undefined) {
      updatePayload.category = body.category;
      updatePayload.supportsUnstitched = body.category === "Three Piece";
    }
    if (body.price !== undefined) updatePayload.price = Number(body.price);
    if (body.stitchingFee !== undefined)
      updatePayload.stitchingFee = Number(body.stitchingFee);
    if (body.description !== undefined)
      updatePayload.description = body.description;
    if (body.fabricDetails !== undefined)
      updatePayload.fabricDetails = body.fabricDetails;
    if (body.careInstructions !== undefined)
      updatePayload.careInstructions = body.careInstructions;
    if (Array.isArray(body.images)) updatePayload.images = body.images;
    if (Array.isArray(body.colors)) updatePayload.colors = body.colors;
    if (Array.isArray(body.sizes)) updatePayload.sizes = body.sizes;
    if (body.inStock !== undefined)
      updatePayload.inStock = Boolean(body.inStock);
    if (body.stockCount !== undefined)
      updatePayload.stockCount = Number(body.stockCount);
    if (body.featured !== undefined)
      updatePayload.featured = Boolean(body.featured);

    const [updated] = await db
      .update(products)
      .set(updatePayload)
      .where(eq(products.id, numericId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product: updated });
  } catch (error) {
    console.error("PUT /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    void request;
    const denied = await requireAdmin();
    if (denied) return denied;
    const { id } = await context.params;
    const numericId = Number(id);

    if (isGithubConfigured()) {
      const current = await readRepoJson<ProductRecord[]>(PRODUCTS_FILE);
      if (Array.isArray(current)) {
        const target = current.find(
          (p) => p.id === numericId || p.slug === id
        );
        if (!target) {
          return NextResponse.json(
            { error: "Product not found" },
            { status: 404 }
          );
        }
        const next = sortProducts(
          current.filter((p) => p.id !== target.id && p.slug !== id)
        );
        await commitJsonFile(PRODUCTS_FILE, next, "Delete product via product API");
        return NextResponse.json({ ok: true });
      }
    }

    // Legacy local-database fallback.
    await ensureSeeded();
    await db.delete(products).where(eq(products.id, numericId));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
