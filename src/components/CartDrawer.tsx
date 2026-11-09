"use client";

import React from "react";
import Link from "next/link";
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useStore, formatPrice } from "@/context/StoreContext";

export function CartDrawer() {
  const {
    cart,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    updateQuantity,
    removeFromCart,
    subtotal,
    settings,
  } = useStore();

  if (!isCartDrawerOpen) return null;

  const estimatedDelivery =
    cart.length > 0 ? settings.deliveryChargeInside : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="fixed inset-0 bg-[#292725]/45 backdrop-blur-xs transition-opacity"
        onClick={() => setIsCartDrawerOpen(false)}
      />

      <div className="relative z-10 w-full max-w-md bg-[#F8F5EF] h-full flex flex-col justify-between border-l border-[#E5DEC9] shadow-2xl">
        {/* Header */}
        <div className="relative px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl text-[#292725]">
              Your Shopping Bag
            </h2>
            <p className="text-xs text-[#6E6A64] tracking-wider uppercase mt-0.5">
              {cart.reduce((sum, i) => sum + i.quantity, 0)} Piece(s) Selected
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCartDrawerOpen(false)}
            aria-label="Close shopping bag"
            className="p-2 text-[#292725] hover:text-[#7A1F3D] transition-colors"
          >
            <X className="w-5 h-5 stroke-[1.5]" />
          </button>
          <div className="gold-hairline absolute bottom-0 left-0 w-full" />
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12">
              <div className="w-14 h-14 rounded-full border border-[#E5DEC9] flex items-center justify-center text-[#6E6A64] mb-4">
                <ShoppingBag className="w-6 h-6 stroke-[1.2]" />
              </div>
              <p className="font-serif text-2xl text-[#292725]">
                Your bag is currently empty
              </p>
              <p className="text-sm text-[#6E6A64] mt-2 max-w-xs">
                Discover our handloom three-piece ensembles, tailored co-ords, or
                commission a custom-fitted outfit.
              </p>
              <Link
                href="/shop"
                onClick={() => setIsCartDrawerOpen(false)}
                className="mt-6 inline-flex items-center gap-2 bg-[#7A1F3D] text-[#F8F5EF] px-6 py-3 text-xs uppercase tracking-[0.16em] btn-sheen transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#61182F]"
              >
                <span>Explore Collection</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartItemId}
                className="flex gap-4 pb-6 border-b border-[#E5DEC9]"
              >
                <Link
                  href={`/product/${item.slug}`}
                  onClick={() => setIsCartDrawerOpen(false)}
                  className="w-20 h-28 shrink-0 bg-[#EFECE4] overflow-hidden border border-[#E5DEC9]"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={() => setIsCartDrawerOpen(false)}
                      className="font-serif text-lg leading-snug text-[#292725] hover:text-[#7A1F3D] transition-colors"
                    >
                      {item.name}
                    </Link>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.cartItemId)}
                      aria-label="Remove item"
                      className="text-[#6E6A64] hover:text-[#9E3B3B] p-1"
                    >
                      <Trash2 className="w-4 h-4 stroke-[1.5]" />
                    </button>
                  </div>

                  <div className="mt-1 space-y-0.5 text-xs text-[#6E6A64]">
                    <p>
                      <span className="uppercase tracking-wider text-[10px] text-[#7A1F3D] font-medium">
                        {item.purchaseMode}
                      </span>{" "}
                      &middot; {item.selectedColor}
                    </p>
                    <p>Size / Option: {item.selectedSize}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="inline-flex items-center border border-[#E5DEC9] bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.cartItemId, item.quantity - 1)
                        }
                        aria-label="Decrease quantity"
                        className="p-1.5 text-[#292725] hover:text-[#7A1F3D]"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 text-xs font-mono text-[#292725]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.cartItemId, item.quantity + 1)
                        }
                        aria-label="Increase quantity"
                        className="p-1.5 text-[#292725] hover:text-[#7A1F3D]"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-sm font-medium text-[#292725]">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary */}
        {cart.length > 0 && (
          <div className="p-6 bg-[#EFECE4]/70 border-t border-[#E5DEC9] space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#6E6A64]">
                <span>Subtotal</span>
                <span className="text-[#292725] font-medium">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-[#6E6A64]">
                <span>Standard Delivery (Inside Dhaka)</span>
                <span>{formatPrice(estimatedDelivery)}</span>
              </div>
              <div className="pt-2 border-t border-[#E5DEC9] flex justify-between text-base font-medium text-[#292725]">
                <span>Estimated Total</span>
                <span className="font-serif text-xl text-[#7A1F3D]">
                  {formatPrice(subtotal + estimatedDelivery)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <Link
                href="/cart"
                onClick={() => setIsCartDrawerOpen(false)}
                className="py-3.5 px-4 border border-[#292725] text-center text-xs uppercase tracking-[0.15em] text-[#292725] hover:bg-[#292725] hover:text-[#F8F5EF] transition-colors"
              >
                View Full Bag
              </Link>
              <Link
                href="/checkout"
                onClick={() => setIsCartDrawerOpen(false)}
                className="py-3.5 px-4 bg-[#7A1F3D] text-center text-xs uppercase tracking-[0.15em] text-[#F8F5EF] btn-sheen transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#61182F]"
              >
                Checkout
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
