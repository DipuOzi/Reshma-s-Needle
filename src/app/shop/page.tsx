"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Scissors, SlidersHorizontal } from "lucide-react";
import { type ProductRecord, useStore } from "@/context/StoreContext";
import { ProductCard } from "@/components/ProductCard";
import { AtelierBackdrop, Motif } from "@/components/AtelierDecor";

const CATEGORIES = ["All", "Three Piece", "Two Piece", "Tops"] as const;

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const shop = useStore().content.shop;
  const initialCategory = searchParams.get("category") || "All";

  const [selectedCategory, setSelectedCategory] =
    useState<string>(initialCategory);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [inStockOnly, setInStockOnly] = useState(false);

  useEffect(() => {
    const paramCat = searchParams.get("category") || "All";
    setSelectedCategory(paramCat);
  }, [searchParams]);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  const handleSelectCategory = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === "All") {
      router.push("/shop", { scroll: false });
    } else {
      router.push(`/shop?category=${encodeURIComponent(cat)}`, {
        scroll: false,
      });
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat =
      selectedCategory === "All" ||
      p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesStock = !inStockOnly || p.inStock;
    return matchesCat && matchesStock;
  });

  return (
    <div className="bg-[#F8F5EF] min-h-screen">
      {/* Editorial Shop Header */}
      <section className="relative overflow-hidden bg-wine-rich py-14 text-[#F8F5EF] lg:py-20">
        <AtelierBackdrop
          items={[
            {
              kind: "scissors",
              className: "absolute -right-8 top-8 hidden w-40 rotate-[30deg] text-[#F8F5EF]/[0.10] xl:block",
              animation: "float-slow",
            },
            {
              kind: "pin",
              className: "absolute right-[34%] top-10 hidden w-9 rotate-[15deg] text-[#E8CE9C]/40 xl:block",
              animation: "sway",
            },
            {
              kind: "button",
              className: "absolute left-[55%] top-8 hidden w-8 text-[#E8CE9C]/30 xl:block",
              animation: "spin",
            },
            {
              kind: "tape",
              className: "absolute left-0 bottom-4 hidden w-52 text-[#F8F5EF]/[0.08] xl:block",
              animation: "float",
            },
          ]}
        />
        <div aria-hidden="true" className="gold-hairline absolute bottom-0 left-0 h-px w-full" />
        <div className="relative max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14">
          <div className="max-w-2xl space-y-4">
            <p className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-[#E8CE9C]">
              <span className="h-px w-8 bg-[#E8CE9C]" />
              {shop.eyebrow}
            </p>
            <h1 className="font-serif text-4xl sm:text-6xl text-[#F8F5EF]">
              {selectedCategory === "All"
                ? shop.titleAll
                : selectedCategory}
            </h1>
            <p className="text-sm sm:text-base text-[#F8F5EF]/75 leading-relaxed">
              {selectedCategory === "Three Piece"
                ? shop.introThreePiece
                : selectedCategory === "Two Piece"
                ? shop.introTwoPiece
                : selectedCategory === "Tops"
                ? shop.introTops
                : shop.introAll}
            </p>
          </div>

          {/* Category Filter Bar */}
          <div className="mt-10 pt-6 border-t border-[#F8F5EF]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {CATEGORIES.map((cat) => {
                const active =
                  selectedCategory.toLowerCase() === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className={`px-5 py-2.5 text-xs uppercase tracking-[0.16em] border transition-colors ${
                      active
                        ? "bg-[#F8F5EF] border-[#F8F5EF] text-[#7A1F3D] font-medium"
                        : "bg-transparent border-[#F8F5EF]/30 text-[#F8F5EF] hover:border-[#F8F5EF]"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-6 text-xs text-[#F8F5EF]/70">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="accent-[#7CA982] w-3.5 h-3.5"
                />
                <span className="uppercase tracking-[0.14em] text-[#F8F5EF]">
                  In Stock Only
                </span>
              </label>
              <span className="uppercase tracking-[0.14em]">
                {filteredProducts.length}{" "}
                {filteredProducts.length === 1 ? "Piece" : "Pieces"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 py-14 lg:py-20">
        {loading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-12 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="space-y-4 animate-pulse">
                <div className="aspect-[3/4] bg-[#EFECE4]" />
                <div className="h-5 bg-[#EFECE4] w-2/3" />
                <div className="h-4 bg-[#EFECE4] w-1/3" />
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-4 border border-[#E5DEC9] bg-[#EFECE4]/40">
            <SlidersHorizontal className="w-8 h-8 text-[#7A1F3D] mx-auto stroke-[1.2]" />
            <h2 className="font-serif text-3xl text-[#292725]">
              No pieces found in this filter
            </h2>
            <p className="text-sm text-[#6E6A64] max-w-md mx-auto">
              Try viewing all categories or commission a bespoke outfit in our
              custom tailoring studio.
            </p>
            <button
              type="button"
              onClick={() => {
                setInStockOnly(false);
                handleSelectCategory("All");
              }}
              className="mt-2 inline-block px-6 py-3 bg-wine-rich text-[#F8F5EF] text-xs uppercase tracking-[0.16em] btn-sheen"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-14 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Bespoke Banner inside Shop */}
        <div className="relative mt-20 p-6 sm:p-12 bg-sage-rich overflow-hidden flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <Motif
            kind="scissors"
            className="absolute -right-6 -bottom-6 w-40 -rotate-[20deg] text-[#292725]/10"
            animation="sway"
          />
          <div
            aria-hidden="true"
            className="absolute left-4 top-4 hidden h-7 w-7 border-l-2 border-t-2 border-[#C6A15B]/70 sm:block"
          />
          <div className="relative space-y-2 max-w-xl">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A1F3D]">
              {shop.bannerEyebrow}
            </p>
            <h3 className="font-serif text-3xl text-[#292725]">
              {shop.bannerTitle}
            </h3>
            <p className="text-sm text-[#292725]/80">
              {shop.bannerText}
            </p>
          </div>
          <Link
            href="/customize"
            className="btn-sheen relative inline-flex w-full items-center justify-center gap-2.5 bg-[#7A1F3D] text-[#F8F5EF] px-7 py-4 text-xs uppercase tracking-[0.16em] hover:bg-[#292725] transition-colors sm:w-auto lg:shrink-0"
          >
            <Scissors className="w-4 h-4" />
            <span>Open Custom Tailoring Studio</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F5EF] flex items-center justify-center">
          <p className="font-serif text-2xl text-[#6E6A64]">
            Loading collection...
          </p>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
