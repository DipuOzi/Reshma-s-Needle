"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Minus,
  Plus,
  Trash2,
  ArrowRight,
  ShoppingBag,
  Scissors,
  MessageCircle,
} from "lucide-react";
import { useStore, formatPrice } from "@/context/StoreContext";
import { Motif, StitchRule } from "@/components/AtelierDecor";

export default function CartPage() {
  const { cart, updateQuantity, removeFromCart, subtotal, settings, content } =
    useStore();
  const page = content.cart;
  const [deliveryZone, setDeliveryZone] = useState<"inside" | "outside">(
    "inside"
  );

  const deliveryFee =
    cart.length === 0
      ? 0
      : deliveryZone === "inside"
      ? settings.deliveryChargeInside
      : settings.deliveryChargeOutside;

  const total = subtotal + deliveryFee;

  const cleanOwnerWa = settings.whatsappNumber.replace(/[^0-9]/g, "");
  const waCartMessage = encodeURIComponent(
    [
      "Hello Reshma's Needle! I would like to place an order via WhatsApp.",
      "",
      "Order Items",
      ...cart.map(
        (item, i) =>
          `${i + 1}. ${item.name} × ${item.quantity} — ${item.purchaseMode} · ${
            item.selectedColor
          } · ${item.selectedSize} — ${formatPrice(
            item.unitPrice * item.quantity
          )}`
      ),
      "",
      `Subtotal: ${formatPrice(subtotal)}`,
      `Estimated Delivery (${
        deliveryZone === "inside" ? "Inside Dhaka" : "Outside Dhaka"
      }): ${formatPrice(deliveryFee)}`,
      `Estimated Total: ${formatPrice(total)}`,
      "",
      "Please confirm availability, delivery details, and payment in this chat.",
    ].join("\n")
  );

  return (
    <div className="bg-ivory-rich relative min-h-screen py-14 lg:py-20">
      <Motif
        kind="pin"
        className="absolute right-6 top-10 w-10 text-[#C6A15B]/60 rotate-[-16deg]"
        animation="sway"
      />
      <div className="relative max-w-[1280px] mx-auto px-5 sm:px-8">
        <div className="border-b border-[#E5DEC9] pb-6 mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#7A1F3D]">
              {page.eyebrow}
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl text-[#292725] mt-1">
              {page.title}
            </h1>
          </div>
          <Link
            href="/shop"
            className="text-xs uppercase tracking-[0.16em] text-[#6E6A64] hover:text-[#7A1F3D]"
          >
            ← Continue Browsing
          </Link>
        </div>

        {cart.length === 0 ? (
          <div className="py-20 text-center bg-white border border-[#E5DEC9] shadow-[0_18px_40px_rgba(41,39,37,0.08)] space-y-5">
            <Motif
              kind="needle"
              className="mx-auto w-9 text-[#C6A15B]/60"
              animation="sway"
            />
            <ShoppingBag className="w-10 h-10 text-[#6E6A64] mx-auto stroke-[1.2]" />
            <h2 className="font-serif text-3xl text-[#292725]">
              {page.emptyTitle}
            </h2>
            <p className="text-sm text-[#6E6A64] max-w-md mx-auto">
              {page.emptyText}
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-4">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 bg-[#7A1F3D] btn-sheen text-[#F8F5EF] px-7 py-3.5 text-xs uppercase tracking-[0.16em]"
              >
                <span>Explore Collection</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/customize"
                className="inline-flex items-center gap-2 border border-[#292725] text-[#292725] px-7 py-3.5 text-xs uppercase tracking-[0.16em]"
              >
                <Scissors className="w-4 h-4" />
                <span>Get It Custom Made</span>
              </Link>
            </div>

            <StitchRule charm="none" className="text-[#C6A15B]/70" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-8 space-y-6">
              {cart.map((item) => (
                <div
                  key={item.cartItemId}
                  className="bg-white border border-[#E5DEC9] p-5 sm:p-6 flex flex-col sm:flex-row gap-6"
                >
                  <Link
                    href={`/product/${item.slug}`}
                    className="w-28 h-36 bg-[#EFECE4] border border-[#E5DEC9] shrink-0 overflow-hidden"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <span className="text-[10px] uppercase tracking-[0.18em] text-[#7A1F3D]">
                            {item.category} &middot; {item.purchaseMode}
                          </span>
                          <Link
                            href={`/product/${item.slug}`}
                            className="block font-serif text-2xl text-[#292725] hover:text-[#7A1F3D] mt-0.5"
                          >
                            {item.name}
                          </Link>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.cartItemId)}
                          className="text-xs text-[#6E6A64] hover:text-[#9E3B3B] inline-flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      </div>

                      <div className="mt-2 space-y-1 text-xs text-[#6E6A64]">
                        <p>
                          Shade:{" "}
                          <strong className="text-[#292725]">
                            {item.selectedColor}
                          </strong>
                        </p>
                        <p>
                          Option / Size:{" "}
                          <strong className="text-[#292725]">
                            {item.selectedSize}
                          </strong>
                        </p>
                        <p>
                          Unit Price:{" "}
                          <span className="text-[#292725]">
                            {formatPrice(item.unitPrice)}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#E5DEC9] flex items-center justify-between">
                      <div className="inline-flex items-center border border-[#E5DEC9] bg-[#F8F5EF]">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.cartItemId, item.quantity - 1)
                          }
                          aria-label="Decrease quantity"
                          className="p-2 text-[#292725] hover:text-[#7A1F3D]"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-4 text-xs font-mono text-[#292725]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.cartItemId, item.quantity + 1)
                          }
                          aria-label="Increase quantity"
                          className="p-2 text-[#292725] hover:text-[#7A1F3D]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-[#6E6A64] block">
                          Line Subtotal
                        </span>
                        <span className="font-serif text-xl text-[#292725]">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary Box */}
            <div className="lg:col-span-4 bg-white border border-[#E5DEC9] border-t-[3px] border-t-[#7A1F3D] shadow-[0_18px_40px_rgba(41,39,37,0.08)] p-6 sm:p-8 space-y-6 lg:sticky lg:top-28">
              <h2 className="font-serif text-2xl text-[#292725] border-b border-[#E5DEC9] pb-3">
                {page.summaryTitle}
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-[#6E6A64]">
                  <span>Subtotal</span>
                  <span className="text-[#292725] font-medium">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="pt-2 space-y-2">
                  <span className="text-xs uppercase tracking-[0.14em] text-[#292725] block">
                    Estimated Delivery Zone
                  </span>
                  <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryZone("inside")}
                      className={`p-2.5 text-xs border text-left ${
                        deliveryZone === "inside"
                          ? "border-[#7A1F3D] bg-[#F8F5EF] text-[#292725] font-medium"
                          : "border-[#E5DEC9] text-[#6E6A64]"
                      }`}
                    >
                      Inside Dhaka ({formatPrice(settings.deliveryChargeInside)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryZone("outside")}
                      className={`p-2.5 text-xs border text-left ${
                        deliveryZone === "outside"
                          ? "border-[#7A1F3D] bg-[#F8F5EF] text-[#292725] font-medium"
                          : "border-[#E5DEC9] text-[#6E6A64]"
                      }`}
                    >
                      Outside Dhaka ({formatPrice(settings.deliveryChargeOutside)}
                      )
                    </button>
                  </div>
                </div>

                <div className="flex justify-between text-[#6E6A64] pt-2">
                  <span>Delivery Charge</span>
                  <span className="text-[#292725] font-medium">
                    {formatPrice(deliveryFee)}
                  </span>
                </div>

                <div className="pt-4 border-t border-[#E5DEC9] flex justify-between items-baseline">
                  <span className="text-base font-medium text-[#292725]">
                    Total Price
                  </span>
                  <span className="font-serif text-3xl text-[#7A1F3D]">
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <Link
                  href="/checkout"
                  className="w-full py-4 px-6 bg-[#7A1F3D] btn-sheen hover:bg-[#61182F] text-[#F8F5EF] text-xs uppercase tracking-[0.18em] transition-colors flex items-center justify-center gap-2"
                >
                  <span>{page.checkoutCta}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-center text-[10px] uppercase tracking-[0.16em] text-[#6E6A64]">
                  — or order directly via —
                </p>
                <a
                  href={`https://wa.me/${cleanOwnerWa}?text=${waCartMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-6 border border-[#7CA982] text-[#7CA982] text-xs uppercase tracking-[0.18em] transition-colors flex items-center justify-center gap-2 hover:bg-[#7CA982] hover:text-[#F8F5EF]"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp</span>
                </a>
                <p className="text-center text-[11px] text-[#6E6A64]">
                  No account needed — we confirm your order directly in the
                  chat.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
