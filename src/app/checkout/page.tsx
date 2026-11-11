"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  MessageCircle,
  AlertCircle,
} from "lucide-react";
import { useStore, formatPrice } from "@/context/StoreContext";
import { Motif, StitchRule } from "@/components/AtelierDecor";
import type { OrderItemPayload } from "@/db/schema";

interface ConfirmedOrderRecord {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  whatsapp: string;
  deliveryAddress: string;
  deliveryZone: string;
  paymentMethod: string;
  paymentTransactionId?: string;
  items: OrderItemPayload[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
}

export default function CheckoutPage() {
  const { cart, subtotal, clearCart, settings, customer, content } =
    useStore();
  const page = content.checkout;

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryZone, setDeliveryZone] = useState<
    "Inside Dhaka" | "Outside Dhaka"
  >("Inside Dhaka");
  const [orderNotes, setOrderNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "Cash on Delivery" | "bKash" | "Nagad"
  >("Cash on Delivery");
  const [paymentTransactionId, setPaymentTransactionId] = useState("");
  const [orderChannel, setOrderChannel] = useState<"online" | "whatsapp">(
    "online"
  );
  const [whatsappOrderUrl, setWhatsappOrderUrl] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] =
    useState<ConfirmedOrderRecord | null>(null);

  useEffect(() => {
    if (customer) {
      setCustomerName((prev) => prev || customer.name);
      setCustomerEmail((prev) => prev || customer.email);
      setPhone((prev) => prev || customer.phone);
      setWhatsapp((prev) => prev || customer.whatsapp || customer.phone);
      setDeliveryAddress((prev) => prev || customer.address);
    }
  }, [customer]);

  const deliveryCharge =
    deliveryZone === "Inside Dhaka"
      ? settings.deliveryChargeInside
      : settings.deliveryChargeOutside;

  const total = subtotal + deliveryCharge;

  const buildWhatsAppOrderMessage = () => {
    const lines = [
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
      `Delivery (${deliveryZone}): ${formatPrice(deliveryCharge)}`,
      `Order Total: ${formatPrice(total)}`,
      "",
      "Delivery Details",
      `Name: ${customerName}`,
      `Phone: ${phone}`,
      `WhatsApp: ${whatsapp}`,
      customerEmail ? `Email: ${customerEmail}` : "",
      `Address: ${deliveryAddress}`,
      orderNotes ? `Notes: ${orderNotes}` : "",
      "",
      `Payment Preference: ${paymentMethod} (to confirm in this chat)`,
    ];
    return lines.filter(Boolean).join("\n");
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (
      !customerName.trim() ||
      !phone.trim() ||
      !whatsapp.trim() ||
      !deliveryAddress.trim()
    ) {
      setError(
        "Please complete your Name, Phone Number, WhatsApp Number, and Delivery Address."
      );
      return;
    }

    if (cart.length === 0) {
      setError("Your shopping bag is empty.");
      return;
    }

    if (orderChannel === "whatsapp") {
      const cleanOwnerWa = settings.whatsappNumber.replace(/[^0-9]/g, "");
      const url = `https://wa.me/${cleanOwnerWa}?text=${encodeURIComponent(
        buildWhatsAppOrderMessage()
      )}`;
      window.open(url, "_blank", "noopener,noreferrer");
      setWhatsappOrderUrl(url);
      setError(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer?.id ?? null,
          customerName,
          customerEmail: customerEmail || customer?.email || null,
          phone,
          whatsapp,
          deliveryAddress,
          deliveryZone,
          orderNotes,
          paymentMethod,
          paymentTransactionId: paymentTransactionId || null,
          items: cart,
          subtotal,
          deliveryCharge,
          total,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not place order. Please try again.");
        setSubmitting(false);
        return;
      }

      setConfirmedOrder(data.order);
      clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Network error while placing order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    const cleanOwnerWa = settings.whatsappNumber.replace(/[^0-9]/g, "");
    const waSummary = encodeURIComponent(
      `Hello Reshma's Needle! I have placed Order #${confirmedOrder.orderNumber}.\nName: ${confirmedOrder.customerName}\nTotal: ${formatPrice(confirmedOrder.total)} (${confirmedOrder.paymentMethod})\nAddress: ${confirmedOrder.deliveryAddress}`
    );

    return (
      <div className="bg-ivory-rich min-h-screen py-16 lg:py-24">
        <div className="max-w-2xl mx-auto px-5 sm:px-8">
          <div className="bg-white border border-[#E5DEC9] p-6 sm:p-12 space-y-8 shadow-[0_18px_40px_rgba(41,39,37,0.08)]">
            <Motif
              kind="button"
              className="mx-auto w-10 text-[#C6A15B]/60"
              animation="sway"
            />
            <div className="flex items-start gap-4 border-b border-[#E5DEC9] pb-6">
              <CheckCircle2 className="w-8 h-8 text-[#4A6B53] shrink-0 mt-1" />
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#4A6B53] font-medium">
                  Order Confirmed &middot; {confirmedOrder.orderNumber}
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl text-[#292725] mt-1">
                  Thank You, {confirmedOrder.customerName}
                </h1>
                <p className="text-sm text-[#6E6A64] mt-2 leading-relaxed">
                  Your order has been received by Reshma&rsquo;s Needle Atelier.
                  We will reach out to your WhatsApp (
                  {confirmedOrder.whatsapp}) prior to dispatch.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs uppercase tracking-[0.18em] text-[#292725] font-medium">
                Ordered Pieces
              </h3>
              <div className="divide-y divide-[#E5DEC9] border border-[#E5DEC9] bg-[#F8F5EF]">
                {confirmedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-serif text-lg text-[#292725]">
                        {item.name} &times; {item.quantity}
                      </p>
                      <p className="text-xs text-[#6E6A64]">
                        {item.purchaseMode} &middot; {item.selectedColor} &middot;{" "}
                        {item.selectedSize}
                      </p>
                    </div>
                    <span className="shrink-0 font-medium text-[#292725]">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#EFECE4]/60 p-5 border border-[#E5DEC9]">
              <div>
                <p className="uppercase tracking-wider text-[#6E6A64]">
                  Delivery Address
                </p>
                <p className="text-[#292725] font-medium mt-1">
                  {confirmedOrder.deliveryAddress} ({confirmedOrder.deliveryZone})
                </p>
              </div>
              <div>
                <p className="uppercase tracking-wider text-[#6E6A64]">
                  Payment Method
                </p>
                <p className="text-[#292725] font-medium mt-1">
                  {confirmedOrder.paymentMethod}
                  {confirmedOrder.paymentTransactionId
                    ? ` (TrxID: ${confirmedOrder.paymentTransactionId})`
                    : ""}
                </p>
              </div>
              <div>
                <p className="uppercase tracking-wider text-[#6E6A64]">
                  Delivery Fee
                </p>
                <p className="text-[#292725] font-medium mt-1">
                  {formatPrice(confirmedOrder.deliveryCharge)}
                </p>
              </div>
              <div>
                <p className="uppercase tracking-wider text-[#6E6A64]">
                  Order Total
                </p>
                <p className="font-serif text-xl text-[#7A1F3D] mt-0.5">
                  {formatPrice(confirmedOrder.total)}
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <a
                href={`https://wa.me/${cleanOwnerWa}?text=${waSummary}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-4 px-6 bg-[#7A1F3D] btn-sheen text-[#F8F5EF] text-xs uppercase tracking-[0.16em] text-center inline-flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share Order Ref on WhatsApp</span>
              </a>
              <Link
                href="/shop"
                className="py-4 px-6 border border-[#292725] text-[#292725] text-xs uppercase tracking-[0.16em] text-center"
              >
                Continue Shopping
              </Link>
            </div>
            <StitchRule charm="none" className="text-[#C6A15B]/70" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-ivory-rich relative min-h-screen py-14 lg:py-20">
      <Motif
        kind="pin"
        className="absolute right-6 top-10 w-10 text-[#C6A15B]/60 rotate-[-16deg]"
        animation="sway"
      />
      <div className="relative max-w-[1280px] mx-auto px-5 sm:px-8">
        <div className="border-b border-[#E5DEC9] pb-6 mb-10 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#7A1F3D]">
              {page.eyebrow}
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl text-[#292725] mt-1">
              {page.title}
            </h1>
          </div>
          <Link
            href="/cart"
            className="inline-flex shrink-0 items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[#6E6A64] hover:text-[#292725]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Bag</span>
          </Link>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-[#9E3B3B]/10 border border-[#9E3B3B] text-[#9E3B3B] flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {whatsappOrderUrl && (
          <div className="mb-8 p-4 bg-[#7CA982]/10 border border-[#4A6B53] flex items-start gap-3 text-sm">
            <MessageCircle className="w-5 h-5 shrink-0 text-[#4A6B53] mt-0.5" />
            <div>
              <p className="font-medium text-[#292725]">
                WhatsApp is open with your order details
              </p>
              <p className="text-[#6E6A64] mt-1 leading-relaxed">
                Press <strong className="text-[#292725]">Send</strong> in
                WhatsApp to place your order — we will confirm payment and
                delivery with you in the chat. If the chat did not open,{" "}
                <a
                  href={whatsappOrderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-[#4A6B53] hover:text-[#292725]"
                >
                  tap here to open it again
                </a>
                . Your bag stays intact until the order is confirmed.
              </p>
            </div>
          </div>
        )}

        <form
          onSubmit={handlePlaceOrder}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start"
        >
          {/* Left Column: Customer & Payment Details */}
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white border border-[#E5DEC9] p-6 sm:p-8 space-y-5">
              <h2 className="font-serif text-2xl text-[#292725] border-b border-[#E5DEC9] pb-3">
                1. Delivery &amp; Contact Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-[0.15em] text-[#292725] mb-1.5">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] text-sm text-[#292725] focus:outline-none focus:border-[#7A1F3D]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.15em] text-[#292725] mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XX-XXXXXX"
                    className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] text-sm text-[#292725] focus:outline-none focus:border-[#7A1F3D]"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-[0.15em] text-[#292725] mb-1.5">
                    WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+880 17XX-XXXXXX"
                    className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] text-sm text-[#292725] focus:outline-none focus:border-[#7A1F3D]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-[0.15em] text-[#292725] mb-1.5">
                    Email Address (Optional, for account order tracking)
                  </label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] text-sm text-[#292725] focus:outline-none focus:border-[#7A1F3D]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-[0.15em] text-[#292725] mb-1.5">
                    Delivery Zone *
                  </label>
                  <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
                    {(["Inside Dhaka", "Outside Dhaka"] as const).map(
                      (zone) => (
                        <button
                          key={zone}
                          type="button"
                          onClick={() => setDeliveryZone(zone)}
                          className={`p-3 border text-left text-xs uppercase tracking-wider ${
                            deliveryZone === zone
                              ? "border-[#7A1F3D] bg-[#7A1F3D] text-[#F8F5EF]"
                              : "border-[#E5DEC9] bg-[#F8F5EF] text-[#292725]"
                          }`}
                        >
                          {zone} (
                          {formatPrice(
                            zone === "Inside Dhaka"
                              ? settings.deliveryChargeInside
                              : settings.deliveryChargeOutside
                          )}
                          )
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-[0.15em] text-[#292725] mb-1.5">
                    Full Delivery Address *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Apartment, House, Road, Area, and City"
                    className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] text-sm text-[#292725] focus:outline-none focus:border-[#7A1F3D]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-[0.15em] text-[#292725] mb-1.5">
                    Order Notes (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Gift wrap requests, preferred delivery timing, or special notes..."
                    className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] text-sm text-[#292725] focus:outline-none focus:border-[#7A1F3D]"
                  />
                </div>
              </div>
            </div>

            {/* Order Channel & Payment Method Section */}
            <div className="bg-white border border-[#E5DEC9] p-6 sm:p-8 space-y-5">
              <h2 className="font-serif text-2xl text-[#292725] border-b border-[#E5DEC9] pb-3">
                2. Order &amp; Payment Method
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setOrderChannel("online")}
                  className={`p-4 border text-left transition-all ${
                    orderChannel === "online"
                      ? "border-[#7A1F3D] bg-[#7A1F3D] text-[#F8F5EF]"
                      : "border-[#E5DEC9] bg-[#F8F5EF] text-[#292725] hover:border-[#292725]"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.16em] font-medium">
                    Place Order Online
                  </p>
                  <p
                    className={`text-[11px] mt-1 ${
                      orderChannel === "online"
                        ? "text-[#F8F5EF]/80"
                        : "text-[#6E6A64]"
                    }`}
                  >
                    Complete checkout on the website &amp; track it in your
                    account
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderChannel("whatsapp")}
                  className={`p-4 border text-left transition-all ${
                    orderChannel === "whatsapp"
                      ? "border-[#4A6B53] bg-[#4A6B53] text-[#F8F5EF]"
                      : "border-[#E5DEC9] bg-[#F8F5EF] text-[#292725] hover:border-[#292725]"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.16em] font-medium">
                    Order via WhatsApp
                  </p>
                  <p
                    className={`text-[11px] mt-1 ${
                      orderChannel === "whatsapp"
                        ? "text-[#F8F5EF]/80"
                        : "text-[#6E6A64]"
                    }`}
                  >
                    Send your order directly to our WhatsApp chat
                  </p>
                </button>
              </div>

              {orderChannel === "whatsapp" && (
                <div className="p-4 bg-[#7CA982]/5 border border-[#4A6B53]/40 text-xs text-[#6E6A64] leading-relaxed">
                  Your bag, delivery details, and total will be pre-filled in a
                  WhatsApp message to{" "}
                  <strong className="text-[#292725]">
                    {settings.whatsappNumber}
                  </strong>
                  . Simply press <strong className="text-[#292725]">Send</strong>{" "}
                  in WhatsApp to place the order, then confirm payment &amp;
                  delivery in the chat.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(["Cash on Delivery", "bKash", "Nagad"] as const).map(
                  (method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => {
                        if (method !== paymentMethod) setPaymentTransactionId("");
                        setPaymentMethod(method);
                      }}
                      className={`p-4 border text-left transition-all ${
                        paymentMethod === method
                          ? "border-[#7A1F3D] bg-[#7A1F3D] text-[#F8F5EF]"
                          : "border-[#E5DEC9] bg-[#F8F5EF] text-[#292725] hover:border-[#292725]"
                      }`}
                    >
                      <p className="text-xs uppercase tracking-[0.16em] font-medium">
                        {method}
                      </p>
                      <p
                        className={`text-[11px] mt-1 ${
                          paymentMethod === method
                            ? "text-[#F8F5EF]/80"
                            : "text-[#6E6A64]"
                        }`}
                      >
                        {method === "Cash on Delivery"
                          ? "Pay in cash upon receiving your parcel"
                          : `Manual ${method} transfer`}
                      </p>
                    </button>
                  )
                )}
              </div>

              {orderChannel === "online" && (
                <>
                  {paymentMethod === "Cash on Delivery" && (
                    <div className="p-4 bg-[#F8F5EF] border border-[#E5DEC9] text-xs text-[#6E6A64] leading-relaxed">
                      You will pay{" "}
                      <strong className="text-[#292725]">
                        {formatPrice(total)}
                      </strong>{" "}
                      in cash when our courier delivers your order to your
                      doorstep.
                    </div>
                  )}

                  {paymentMethod === "bKash" && (
                    <div className="p-5 bg-[#EFECE4]/70 border border-[#7A1F3D]/40 space-y-3 text-xs">
                      <p className="uppercase tracking-[0.15em] text-[#7A1F3D] font-medium">
                        bKash Payment Instructions &middot;{" "}
                        {settings.bkashNumber}
                      </p>
                      <p className="text-[#292725] leading-relaxed">
                        {settings.bkashInstructions}
                      </p>
                      <div className="pt-1">
                        <label className="block text-[11px] uppercase tracking-wider text-[#292725] mb-1">
                          bKash Transaction ID (TrxID) — Optional if sending via
                          WhatsApp
                        </label>
                        <input
                          type="text"
                          value={paymentTransactionId}
                          onChange={(e) =>
                            setPaymentTransactionId(e.target.value)
                          }
                          placeholder="e.g., BK9482716XM"
                          className="w-full px-3.5 py-2.5 bg-white border border-[#E5DEC9] font-mono text-xs text-[#292725]"
                        />
                      </div>
                    </div>
                  )}

                  {paymentMethod === "Nagad" && (
                    <div className="p-5 bg-[#EFECE4]/70 border border-[#7A1F3D]/40 space-y-3 text-xs">
                      <p className="uppercase tracking-[0.15em] text-[#7A1F3D] font-medium">
                        Nagad Payment Instructions &middot;{" "}
                        {settings.nagadNumber}
                      </p>
                      <p className="text-[#292725] leading-relaxed">
                        {settings.nagadInstructions}
                      </p>
                      <div className="pt-1">
                        <label className="block text-[11px] uppercase tracking-wider text-[#292725] mb-1">
                          Nagad Transaction ID — Optional if sending via
                          WhatsApp
                        </label>
                        <input
                          type="text"
                          value={paymentTransactionId}
                          onChange={(e) =>
                            setPaymentTransactionId(e.target.value)
                          }
                          placeholder="e.g., NG7381920PL"
                          className="w-full px-3.5 py-2.5 bg-white border border-[#E5DEC9] font-mono text-xs text-[#292725]"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {orderChannel === "whatsapp" && (
                <div className="p-4 bg-[#F8F5EF] border border-[#E5DEC9] text-xs text-[#6E6A64] leading-relaxed">
                  {paymentMethod === "Cash on Delivery" ? (
                    <>
                      You will pay{" "}
                      <strong className="text-[#292725]">
                        {formatPrice(total)}
                      </strong>{" "}
                      in cash when the courier delivers — no advance payment
                      needed.
                    </>
                  ) : (
                    <>
                      We will share the{" "}
                      <strong className="text-[#292725]">{paymentMethod}</strong>{" "}
                      payment instructions in the WhatsApp chat after you confirm
                      the order.
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Review & Submit */}
          <div className="lg:col-span-5 bg-white border border-[#E5DEC9] border-t-[3px] border-t-[#7A1F3D] shadow-[0_18px_40px_rgba(41,39,37,0.08)] p-6 sm:p-8 space-y-6 lg:sticky lg:top-28">
            <h2 className="font-serif text-2xl text-[#292725] border-b border-[#E5DEC9] pb-3">
              {page.summaryTitle} ({cart.reduce((s, i) => s + i.quantity, 0)}{" "}
              Pieces)
            </h2>

            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.cartItemId}
                  className="flex items-start justify-between gap-3 pb-3 border-b border-[#E5DEC9] text-xs"
                >
                  <div className="flex min-w-0 gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-12 shrink-0 object-cover border border-[#E5DEC9]"
                    />
                    <div className="min-w-0">
                      <p className="font-serif text-base text-[#292725]">
                        {item.name}
                      </p>
                      <p className="text-[#6E6A64]">
                        {item.purchaseMode} &middot; {item.selectedColor}
                      </p>
                      <p className="text-[#6E6A64]">
                        Qty: {item.quantity} &times; {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 font-medium text-[#292725]">
                    {formatPrice(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-sm pt-2">
              <div className="flex justify-between text-[#6E6A64]">
                <span>Subtotal</span>
                <span className="text-[#292725]">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#6E6A64]">
                <span>Delivery ({deliveryZone})</span>
                <span className="text-[#292725]">
                  {formatPrice(deliveryCharge)}
                </span>
              </div>
              <div className="pt-3 border-t border-[#E5DEC9] flex justify-between items-baseline">
                <span className="font-medium text-[#292725]">Total Payable</span>
                <span className="font-serif text-3xl text-[#7A1F3D]">
                  {formatPrice(total)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || cart.length === 0}
              className={`w-full py-4 px-6 btn-sheen disabled:opacity-50 text-[#F8F5EF] text-xs uppercase tracking-[0.18em] transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                orderChannel === "whatsapp"
                  ? "bg-[#4A6B53] hover:bg-[#3A5544]"
                  : "bg-[#7A1F3D] hover:bg-[#61182F]"
              }`}
            >
              {orderChannel === "whatsapp" ? (
                <MessageCircle className="w-4 h-4" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              <span>
                {submitting
                  ? "Placing Your Order..."
                  : orderChannel === "whatsapp"
                  ? "Order via WhatsApp"
                  : "Confirm & Place Order"}
              </span>
            </button>
            {orderChannel === "whatsapp" && (
              <p className="text-center text-[11px] text-[#6E6A64]">
                You will be redirected to WhatsApp with your order pre-filled.
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
