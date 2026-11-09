"use client";

import React from "react";
import Link from "next/link";
import { Eye, Scissors } from "lucide-react";
import {
  type ProductRecord,
  useStore,
  formatPrice,
} from "@/context/StoreContext";

interface ProductCardProps {
  product: ProductRecord;
}

export function ProductCard({ product }: ProductCardProps) {
  const { setQuickViewProduct } = useStore();
  const isThreePiece = product.category === "Three Piece";

  return (
    <div className="group flex flex-col">
      {/* Image Container with 3:4 Portrait Aspect Ratio */}
      <div className="relative aspect-[3/4] w-full bg-[#EFECE4] overflow-hidden border border-[#E5DEC9]/70 shadow-[0_10px_24px_rgba(41,39,37,0.08)] transition-all duration-500 group-hover:shadow-[0_22px_44px_rgba(122,31,61,0.22)] group-hover:border-[#C6A15B]/50">
        <Link href={`/product/${product.slug}`} className="block w-full h-full">
          <img
            src={product.images[0] || "/images/collection-three-piece.jpg"}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        </Link>

        {/* Subtle Category / Bespoke Badge */}
        <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 pointer-events-none">
          <span className="bg-[#F8F5EF]/92 backdrop-blur-xs px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[#292725]">
            {product.category}
          </span>
          {!product.inStock && (
            <span className="bg-[#292725] text-[#F8F5EF] px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]">
              Sold Out
            </span>
          )}
        </div>

        {/* Hover Quick View & Custom Tailor Action Bar */}
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 opacity-95 lg:opacity-0 lg:translate-y-2 lg:group-hover:opacity-100 lg:group-hover:translate-y-0 transition-all duration-300">
          <button
            type="button"
            onClick={() => setQuickViewProduct(product)}
            className="flex-1 bg-[#F8F5EF]/95 hover:bg-[#292725] text-[#292725] hover:text-[#F8F5EF] py-2.5 px-3 text-[11px] uppercase tracking-[0.15em] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Eye className="w-3.5 h-3.5 stroke-[1.5]" />
            <span>Quick View</span>
          </button>
          <Link
            href={`/customize?productId=${product.id}`}
            title="Get It Custom Stitched"
            className="bg-[#7A1F3D]/95 hover:bg-[#61182F] text-[#F8F5EF] py-2.5 px-3 text-[11px] uppercase tracking-[0.14em] transition-colors flex items-center justify-center gap-1 shadow-sm"
          >
            <Scissors className="w-3.5 h-3.5 stroke-[1.5]" />
            <span className="hidden sm:inline">Bespoke</span>
          </Link>
        </div>
      </div>

      {/* Minimal Editorial Product Details (max 4 data points) */}
      <div className="pt-4 flex flex-col space-y-1">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/product/${product.slug}`}
            className="font-serif text-xl text-[#292725] group-hover:text-[#7A1F3D] transition-colors leading-snug"
          >
            {product.name}
          </Link>
          <span className="font-sans text-sm font-medium text-[#292725] shrink-0 pt-0.5">
            {formatPrice(product.price)}
          </span>
        </div>

        <p className="text-xs text-[#6E6A64] tracking-wide">
          {isThreePiece
            ? "Available Unstitched or Custom Stitched"
            : `Sizes: ${product.sizes.slice(0, 4).join(", ")} + Bespoke`}
        </p>
      </div>
    </div>
  );
}
