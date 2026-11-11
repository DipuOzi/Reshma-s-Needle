"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Minus,
  Plus,
  Scissors,
  ShoppingBag,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import {
  useStore,
  formatPrice,
  type ProductRecord,
} from "@/context/StoreContext";
import { ProductCard } from "@/components/ProductCard";
import { Motif } from "@/components/AtelierDecor";

export default function ProductDetailsPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { addToCart, content } = useStore();
  const page = content.product;

  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeImage, setActiveImage] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [threePieceMode, setThreePieceMode] = useState<
    "Unstitched" | "Custom Stitched"
  >("Unstitched");
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    async function loadProduct() {
      setLoading(true);
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const all: ProductRecord[] = data.products || [];
          const found = all.find(
            (p) => p.slug === params.slug || String(p.id) === params.slug
          );
          if (found) {
            setProduct(found);
            setActiveImage(
              found.images[0] || "/images/collection-three-piece.jpg"
            );
            setSelectedColor(found.colors[0] || "Warm Ivory");
            setSelectedSize(found.sizes[0] || "M");
            setThreePieceMode("Unstitched");
            setRelatedProducts(
              all.filter((p) => p.id !== found.id).slice(0, 3)
            );
          }
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    if (params.slug) {
      loadProduct();
    }
  }, [params.slug]);

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 py-16">
        <div className="grid grid-cols-1 gap-12 animate-pulse md:grid-cols-12">
          <div className="aspect-[3/4] bg-[#EFECE4] md:col-span-6 lg:col-span-7" />
          <div className="space-y-6 md:col-span-6 lg:col-span-5">
            <div className="h-8 bg-[#EFECE4] w-2/3" />
            <div className="h-6 bg-[#EFECE4] w-1/3" />
            <div className="h-28 bg-[#EFECE4] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto px-5 py-24 text-center space-y-5">
        <h1 className="font-serif text-4xl text-[#292725]">Piece Not Found</h1>
        <p className="text-sm text-[#6E6A64]">
          The requested garment could not be found in our current collection.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 bg-[#7A1F3D] text-[#F8F5EF] px-7 py-3.5 text-xs uppercase tracking-[0.16em] btn-sheen transition-all duration-300 hover:-translate-y-0.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Shop</span>
        </Link>
      </div>
    );
  }

  const isThreePiece = product.category === "Three Piece";
  const isCustomMode =
    (isThreePiece && threePieceMode === "Custom Stitched") ||
    (!isThreePiece && selectedSize === "Custom Tailored");

  const effectiveUnitPrice = isCustomMode
    ? product.price + product.stitchingFee
    : product.price;

  const handlePrimaryAction = () => {
    if (isCustomMode) {
      router.push(
        `/customize?productId=${product.id}&color=${encodeURIComponent(
          selectedColor
        )}`
      );
      return;
    }

    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      image: product.images[0] || "/images/collection-three-piece.jpg",
      unitPrice: effectiveUnitPrice,
      quantity,
      purchaseMode: isThreePiece ? "Unstitched" : "Ready-to-Wear",
      selectedColor,
      selectedSize: isThreePiece
        ? "Unstitched (Full 3-Piece Fabric)"
        : selectedSize,
    });
  };

  return (
    <div className="bg-ivory-rich min-h-screen">
      {/* Breadcrumb Bar */}
      <div className="border-b border-[#E5DEC9]">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 py-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-[#6E6A64]">
          <div className="flex min-w-0 items-center gap-2">
            <Link href="/" className="hover:text-[#7A1F3D]">
              Home
            </Link>
            <span>/</span>
            <Link
              href={`/shop?category=${encodeURIComponent(product.category)}`}
              className="hover:text-[#7A1F3D]"
            >
              {product.category}
            </Link>
            <span>/</span>
            <span className="text-[#292725] truncate max-w-[200px] sm:max-w-none">
              {product.name}
            </span>
          </div>

          <Link
            href="/shop"              className="inline-flex shrink-0 items-center gap-1.5 text-[#292725] hover:text-[#7A1F3D] uppercase tracking-[0.14em]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Shop</span>
          </Link>
        </div>
      </div>

      {/* Main Product Showcase */}
      <section className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 py-12 lg:py-16">
        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-12 lg:gap-14">
          {/* Left Column: Large Product Image Gallery */}
          <div className="flex flex-col-reverse gap-4 sm:flex-row md:col-span-6 lg:col-span-7">
            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex sm:flex-col gap-3 shrink-0 overflow-x-auto sm:overflow-visible">
                {product.images.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(imgUrl)}
                    className={`w-20 h-28 bg-[#EFECE4] overflow-hidden border transition-all shrink-0 ${
                      activeImage === imgUrl
                        ? "border-[#7A1F3D] ring-1 ring-[#7A1F3D]"
                        : "border-[#E5DEC9] opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${product.name} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Primary Portrait Image */}
            <div className="flex-1 aspect-[3/4] bg-[#EFECE4] border border-[#E5DEC9] overflow-hidden relative shadow-[0_24px_50px_rgba(41,39,37,0.12)]">
              <img
                src={activeImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-4 left-4 bg-[#F8F5EF]/92 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#7A1F3D]">
                {product.category}
              </span>
            </div>
          </div>

          {/* Right Column: Product Information & Tailoring Options */}
          <div className="space-y-7 md:col-span-6 md:sticky md:top-28 lg:col-span-5">
            <div className="space-y-2 border-b border-[#E5DEC9] pb-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs uppercase tracking-[0.2em] text-[#7A1F3D]">
                  {product.category} Collection
                </span>
                <span
                  className={`text-xs uppercase tracking-[0.14em] px-2.5 py-0.5 ${
                    product.inStock
                      ? "bg-[#7CA982]/30 text-[#292725]"
                      : "bg-[#9E3B3B]/15 text-[#9E3B3B]"
                  }`}
                >
                  {product.inStock
                    ? `In Stock (${product.stockCount} Available)`
                    : "Currently Out of Stock"}
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] text-[#292725] leading-[1.12]">
                {product.name}
              </h1>

              <div className="pt-2 relative flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-serif text-3xl text-[#7A1F3D]">
                  {formatPrice(effectiveUnitPrice)}
                </span>
                {isCustomMode && (
                  <span className="text-xs text-[#6E6A64]">
                    (Includes {formatPrice(product.stitchingFee)} bespoke
                    atelier stitching)
                  </span>
                )}
                <Motif
                  kind="pin"
                  className="hidden sm:block absolute right-0 top-0 w-6 rotate-[18deg] text-[#C6A15B]/70"
                  animation="sway"
                />
              </div>
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base text-[#6E6A64] leading-relaxed">
              {product.description}
            </p>

            {/* Available Colors */}
            <div className="space-y-2.5">
              <label className="block text-xs uppercase tracking-[0.16em] text-[#292725]">
                Selected Color:{" "}
                <span className="text-[#6E6A64] font-normal">
                  {selectedColor}
                </span>
              </label>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`px-4 py-2 text-xs border transition-colors ${
                      selectedColor === color
                        ? "border-[#7A1F3D] bg-[#7A1F3D] text-[#F8F5EF]"
                        : "border-[#E5DEC9] bg-white text-[#292725] hover:border-[#7A1F3D]"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Three Piece Dual Option OR Two Piece / Tops Size Selector */}
            {isThreePiece ? (
              <div className="space-y-3 pt-1">
                <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-xs uppercase tracking-[0.16em] text-[#292725]">
                    Choose Three Piece Purchasing Option
                  </label>
                  <span className="text-[11px] text-[#7A1F3D] italic font-serif">
                    Signature Atelier Service
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {/* Option 1: Buy Unstitched */}
                  <button
                    type="button"
                    onClick={() => setThreePieceMode("Unstitched")}
                    className={`p-4 border text-left transition-all flex items-start justify-between gap-4 ${
                      threePieceMode === "Unstitched"
                        ? "border-[#7A1F3D] bg-white shadow-xs"
                        : "border-[#E5DEC9] bg-transparent hover:border-[#292725]"
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.16em] font-medium text-[#292725]">
                        1. Buy Unstitched (Ready-Made Fabric Set)
                      </p>
                      <p className="text-xs text-[#6E6A64] leading-relaxed">
                        Receive the complete unstitched 3-piece handloom fabric
                        (Kameez, Trouser &amp; Dupatta) without tailoring.
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-serif text-lg text-[#292725] block">
                        {formatPrice(product.price)}
                      </span>
                      {threePieceMode === "Unstitched" && (
                        <Check className="w-4 h-4 text-[#7A1F3D] ml-auto mt-1" />
                      )}
                    </div>
                  </button>

                  {/* Option 2: Get It Custom Stitched */}
                  <button
                    type="button"
                    onClick={() => setThreePieceMode("Custom Stitched")}
                    className={`p-4 border text-left transition-all flex items-start justify-between gap-4 ${
                      threePieceMode === "Custom Stitched"
                        ? "border-[#7A1F3D] bg-white shadow-xs"
                        : "border-[#E5DEC9] bg-transparent hover:border-[#292725]"
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.16em] font-medium text-[#7A1F3D] flex items-center gap-1.5">
                        <Scissors className="w-3.5 h-3.5" />
                        <span>2. Get It Custom Stitched</span>
                      </p>
                      <p className="text-xs text-[#6E6A64] leading-relaxed">
                        Professionally tailored by Reshma&rsquo;s Needle based on
                        your exact body measurements &amp; neckline preferences.
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-serif text-lg text-[#7A1F3D] block">
                        {formatPrice(product.price + product.stitchingFee)}
                      </span>
                      {threePieceMode === "Custom Stitched" && (
                        <Check className="w-4 h-4 text-[#7A1F3D] ml-auto mt-1" />
                      )}
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-xs uppercase tracking-[0.16em] text-[#292725]">
                    Select Size or Bespoke Fit
                  </label>
                  <Link
                    href={`/customize?productId=${product.id}&color=${encodeURIComponent(
                      selectedColor
                    )}`}
                    className="text-xs text-[#7A1F3D] underline underline-offset-4 hover:text-[#292725]"
                  >
                    Need custom measurements?
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2.5 text-xs uppercase tracking-[0.12em] border transition-colors ${
                        selectedSize === size
                          ? "border-[#7A1F3D] bg-[#7A1F3D] text-[#F8F5EF]"
                          : "border-[#E5DEC9] bg-white text-[#292725] hover:border-[#7A1F3D]"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Primary CTA */}
            <div className="pt-2 space-y-3">
              {!isCustomMode && (
                <div className="flex items-center gap-4">
                  <span className="text-xs uppercase tracking-[0.16em] text-[#292725]">
                    Quantity
                  </span>
                  <div className="inline-flex items-center border border-[#E5DEC9] bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                      className="p-2.5 text-[#292725] hover:text-[#7A1F3D]"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-4 text-sm font-mono text-[#292725]">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      aria-label="Increase quantity"
                      className="p-2.5 text-[#292725] hover:text-[#7A1F3D]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  disabled={!product.inStock}
                  onClick={handlePrimaryAction}
                  className="flex-1 inline-flex items-center justify-center gap-2.5 bg-[#7A1F3D] text-[#F8F5EF] py-4 px-7 text-xs uppercase tracking-[0.18em] btn-sheen transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#61182F] disabled:opacity-50"
                >
                  {isCustomMode ? (
                    <>
                      <Scissors className="w-4 h-4" />
                      <span>Proceed to Custom Measurements</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>
                        {isThreePiece
                          ? "Add Unstitched Set to Bag"
                          : "Add to Shopping Bag"}
                      </span>
                    </>
                  )}
                </button>

                {!isCustomMode && (
                  <Link
                    href={`/customize?productId=${product.id}&color=${encodeURIComponent(
                      selectedColor
                    )}`}
                    className="inline-flex items-center justify-center gap-2 border border-[#292725] text-[#292725] py-4 px-6 text-xs uppercase tracking-[0.16em] hover:bg-[#292725] hover:text-[#F8F5EF] transition-colors"
                  >
                    <Scissors className="w-4 h-4" />
                    <span>Get It Custom Stitched</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Fabric Details & Care Specifications */}
            <div className="pt-6 border-t border-[#E5DEC9] space-y-4 text-sm">
              <div>
                <h3 className="text-xs uppercase tracking-[0.18em] text-[#292725] font-medium">
                  Fabric &amp; Craftsmanship Details
                </h3>
                <p className="text-[#6E6A64] mt-1.5 leading-relaxed">
                  {product.fabricDetails}
                </p>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-[0.18em] text-[#292725] font-medium">
                  Garment Care
                </h3>
                <p className="text-[#6E6A64] mt-1.5 leading-relaxed">
                  {product.careInstructions}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Pieces */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-[#E5DEC9] py-16 lg:py-24 max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14">
          <h2 className="font-serif text-3xl sm:text-4xl text-[#292725] mb-10">
            {page.relatedTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
