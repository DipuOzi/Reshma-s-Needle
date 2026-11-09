import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await ensureSeeded();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");

    let allProducts = await db
      .select()
      .from(products)
      .orderBy(desc(products.featured), desc(products.id));

    if (category && category !== "All") {
      allProducts = allProducts.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (featured === "true") {
      allProducts = allProducts.filter((p) => p.featured);
    }

    return NextResponse.json({ products: allProducts });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;
    await ensureSeeded();
    const body = await request.json();
    const {
      name,
      category,
      price,
      stitchingFee,
      description,
      fabricDetails,
      careInstructions,
      images,
      colors,
      sizes,
      inStock,
      stockCount,
      featured,
    } = body;

    if (!name || !category || price === undefined) {
      return NextResponse.json(
        { error: "Name, category, and price are required." },
        { status: 400 }
      );
    }

    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;

    const isThreePiece = category === "Three Piece";

    const [created] = await db
      .insert(products)
      .values({
        slug,
        name: String(name).trim(),
        category,
        price: Number(price),
        stitchingFee: Number(stitchingFee ?? (isThreePiece ? 1400 : 850)),
        description:
          description ||
          "Thoughtfully crafted in our Dhaka atelier using pure handpicked fabrics.",
        fabricDetails:
          fabricDetails ||
          "Artisanal handloom weave with breathable inner lining.",
        careInstructions:
          careInstructions ||
          "Dry clean recommended. Store away from direct sunlight.",
        images:
          Array.isArray(images) && images.length > 0
            ? images
            : ["/images/collection-three-piece.jpg"],
        colors:
          Array.isArray(colors) && colors.length > 0
            ? colors
            : ["Warm Ivory", "Deep Wine"],
        sizes:
          Array.isArray(sizes) && sizes.length > 0
            ? sizes
            : isThreePiece
            ? ["Unstitched", "Custom Stitched"]
            : ["XS", "S", "M", "L", "XL", "Custom Tailored"],
        inStock: inStock ?? true,
        stockCount: Number(stockCount ?? 10),
        featured: Boolean(featured),
        supportsUnstitched: isThreePiece,
        supportsCustomTailoring: true,
      })
      .returning();

    return NextResponse.json({ product: created }, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
