import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { eq, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSeeded();
    const { id } = await context.params;
    const numericId = Number(id);

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
    await ensureSeeded();
    const { id } = await context.params;
    const numericId = Number(id);
    const body = await request.json();

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
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;
    await ensureSeeded();
    const { id } = await context.params;
    const numericId = Number(id);

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
