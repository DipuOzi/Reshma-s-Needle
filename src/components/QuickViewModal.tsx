"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Scissors, ShoppingBag, Check } from "lucide-react";
import { useStore, formatPrice } from "@/context/StoreContext";

export function QuickViewModal() {
  const router = useRouter();
  const { quickViewProduct, setQuickViewProduct, addToCart } = useStore();
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [threePieceMode, setThreePieceMode] = useState<
    "Unstitched" | "Custom Stitched"
  >("Unstitched");

  useEffect(() => {
    if (quickViewProduct) {
      setSelectedColor(quickViewProduct.colors[0] || "Warm Ivory");
      setSelectedSize(quickViewProduct.sizes[0] || "M");
      setThreePieceMode("Unstitched");
    }
  }, [quickViewProduct]);

  if (!quickViewProduct) return null;

  const isThreePiece = quickViewProduct.category === "Three Piece";
  const effectivePrice =
    isThreePiece && threePieceMode === "Custom Stitched"
      ? quickViewProduct.price + quickViewProduct.stitchingFee
      : quickViewProduct.price;

  const handleAddToCart = () => {
    if (isThreePiece && threePieceMode === "Custom Stitched") {
      const pid = quickViewProduct.id;
      const color = encodeURIComponent(selectedColor);
      setQuickViewProduct(null);
      router.push(`/customize?productId=${pid}&color=${color}`);
      return;
    }

    addToCart({
      productId: quickViewProduct.id,
      slug: quickViewProduct.slug,
      name: quickViewProduct.name,
      category: quickViewProduct.category,
      image: quickViewProduct.images[0] || "/images/collection-three-piece.jpg",
      unitPrice: effectivePrice,
      quantity: 1,
      purchaseMode: isThreePiece ? "Unstitched" : "Ready-to-Wear",
      selectedColor,
      selectedSize: isThreePiece ? "Unstitched (Fabric Set)" : selectedSize,
    });
    setQuickViewProduct(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-[#292725]/55 backdrop-blur-xs"
        onClick={() => setQuickViewProduct(null)}
      />

      <div className="relative z-10 grid max-h-[90svh] w-full max-w-3xl grid-cols-1 overflow-y-auto border border-[#E5DEC9] bg-[#F8F5EF] shadow-2xl md:grid-cols-12">
        <button
          type="button"
          onClick={() => setQuickViewProduct(null)}
          aria-label="Close quick view"
          className="absolute top-4 right-4 z-20 p-2 bg-[#F8F5EF]/80 text-[#292725] hover:text-[#7A1F3D]"
        >
          <X className="w-5 h-5 stroke-[1.5]" />
        </button>

        {/* Image Column */}
        <div className="md:col-span-5 bg-[#EFECE4] relative aspect-[3/4] md:aspect-auto">
          <img
            src={
              quickViewProduct.images[0] || "/images/collection-three-piece.jpg"
            }
            alt={quickViewProduct.name}
            className="w-full h-full object-cover"
          />
          <span className="absolute top-4 left-4 bg-[#F8F5EF]/90 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#7A1F3D]">
            {quickViewProduct.category}
          </span>
        </div>

        {/* Details Column */}
        <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#6E6A64]">
              Reshma&rsquo;s Needle Atelier
            </p>
            <h3 className="font-serif text-2xl sm:text-3xl text-[#292725] mt-1">
              {quickViewProduct.name}
            </h3>
            <p className="font-serif text-2xl text-[#7A1F3D] mt-2">
              {formatPrice(effectivePrice)}
            </p>
            <div className="gold-hairline w-full mt-3" />

            <p className="text-sm text-[#6E6A64] leading-relaxed mt-4">
              {quickViewProduct.description}
            </p>

            {/* Color Selection */}
            <div className="mt-5">
              <label className="block text-[11px] uppercase tracking-[0.15em] text-[#292725] mb-2">
                Shade: <span className="text-[#6E6A64]">{selectedColor}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {quickViewProduct.colors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`px-3 py-1.5 text-xs border transition-colors ${
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

            {/* Three Piece Purchasing Mode OR Standard Size Selection */}
            {isThreePiece ? (
              <div className="mt-5">
                <label className="block text-[11px] uppercase tracking-[0.15em] text-[#292725] mb-2">
                  Three Piece Tailoring Preference
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setThreePieceMode("Unstitched")}
                    className={`p-3 border text-left transition-all ${
                      threePieceMode === "Unstitched"
                        ? "border-[#7A1F3D] bg-white"
                        : "border-[#E5DEC9] bg-transparent hover:border-[#292725]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-[#292725]">
                        Buy Unstitched
                      </span>
                      {threePieceMode === "Unstitched" && (
                        <Check className="w-3.5 h-3.5 text-[#7A1F3D]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#6E6A64] mt-1">
                      Complete 3-piece fabric set ({formatPrice(quickViewProduct.price)})
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setThreePieceMode("Custom Stitched")}
                    className={`p-3 border text-left transition-all ${
                      threePieceMode === "Custom Stitched"
                        ? "border-[#7A1F3D] bg-white"
                        : "border-[#E5DEC9] bg-transparent hover:border-[#292725]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-wider text-[#7A1F3D]">
                        Get It Custom Stitched
                      </span>
                      {threePieceMode === "Custom Stitched" && (
                        <Check className="w-3.5 h-3.5 text-[#7A1F3D]" />
                      )}
                    </div>
                    <p className="text-[11px] text-[#6E6A64] mt-1">
                      Tailored to your measurements (+{formatPrice(quickViewProduct.stitchingFee)})
                    </p>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5">
                <label className="block text-[11px] uppercase tracking-[0.15em] text-[#292725] mb-2">
                  Select Size
                </label>
                <div className="flex flex-wrap gap-2">
                  {quickViewProduct.sizes.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSelectedSize(sz)}
                      className={`px-3.5 py-1.5 text-xs border transition-colors ${
                        selectedSize === sz
                          ? "border-[#7A1F3D] bg-[#7A1F3D] text-[#F8F5EF]"
                          : "border-[#E5DEC9] bg-white text-[#292725] hover:border-[#7A1F3D]"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#E5DEC9] flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-[#7A1F3D] text-[#F8F5EF] py-3.5 px-5 text-xs uppercase tracking-[0.16em] btn-sheen transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#61182F]"
            >
              {isThreePiece && threePieceMode === "Custom Stitched" ? (
                <>
                  <Scissors className="w-4 h-4" />
                  <span>Proceed to Measurements</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Bag</span>
                </>
              )}
            </button>

            <Link
              href={`/product/${quickViewProduct.slug}`}
              onClick={() => setQuickViewProduct(null)}
              className="py-3.5 px-5 border border-[#292725] text-center text-xs uppercase tracking-[0.16em] text-[#292725] hover:bg-[#292725] hover:text-[#F8F5EF] transition-colors"
            >
              Full Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
