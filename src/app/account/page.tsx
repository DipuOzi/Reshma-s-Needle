"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  Package,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Scissors,
  Eye,
} from "lucide-react";
import { useStore, formatPrice } from "@/context/StoreContext";
import { Motif, StitchRule } from "@/components/AtelierDecor";
import { BrandLogo } from "@/components/BrandLogo";
import type { OrderItemPayload } from "@/db/schema";

interface OrderRecord {
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
  status: string;
  createdAt: string;
}

export default function CustomerAccountPage() {
  const { customer, setCustomer, showToast, content } = useStore();
  const page = content.account;

  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("samira@example.com");
  const [password, setPassword] = useState("reshma2026");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Logged-in state
  const [activeTab, setActiveTab] = useState<"orders" | "profile">("orders");
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);

  // Profile form state
  const [profName, setProfName] = useState("");
  const [profPhone, setProfPhone] = useState("");
  const [profWhatsapp, setProfWhatsapp] = useState("");
  const [profAddress, setProfAddress] = useState("");

  useEffect(() => {
    if (customer) {
      setProfName(customer.name);
      setProfPhone(customer.phone);
      setProfWhatsapp(customer.whatsapp);
      setProfAddress(customer.address);

      fetch(`/api/orders?email=${encodeURIComponent(customer.email)}`, {
        cache: "no-store",
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.orders) setOrders(data.orders);
        })
        .catch(() => {});
    }
  }, [customer]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          authMode === "login"
            ? { action: "login", email, password }
            : {
                action: "register",
                name,
                email,
                phone,
                whatsapp: whatsapp || phone,
                address,
                password,
              }
        ),
      });

      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Authentication failed");
        setLoading(false);
        return;
      }

      setCustomer(data.customer);
      setOrders(data.orders || []);
      showToast(`Welcome, ${data.customer.name}`);
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateProfile",
          id: customer.id,
          name: profName,
          phone: profPhone,
          whatsapp: profWhatsapp,
          address: profAddress,
        }),
      });
      const data = await res.json();
      if (res.ok && data.customer) {
        setCustomer(data.customer);
        showToast("Your account information has been updated");
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (!customer) {
    return (
      <div className="bg-ivory-rich flex min-h-screen items-center py-10 lg:py-16">
        <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">
          <div className="grid grid-cols-1 overflow-hidden border border-[#E5DEC9] bg-white shadow-[0_28px_60px_rgba(41,39,37,0.12)] lg:grid-cols-2">
            {/* Brand panel — desktop only */}
            <div className="relative hidden flex-col justify-between overflow-hidden bg-charcoal-rich p-10 text-[#F8F5EF] lg:flex">
              <div
                aria-hidden="true"
                className="gold-hairline absolute left-0 top-0 h-px w-full"
              />
              <Motif
                kind="needle"
                className="absolute -bottom-12 -right-8 w-44 rotate-[14deg] text-[#F8F5EF]/[0.06]"
                animation="float-slow"
              />
              <Motif
                kind="button"
                className="absolute right-10 top-10 w-12 text-[#E8CE9C]/20"
                animation="spin"
              />

              <div className="relative space-y-8">
                <BrandLogo variant="light" size="lg" href="/" />
                <h2 className="font-serif text-3xl leading-snug text-[#F8F5EF]">
                  Where handloom heritage meets personal tailoring.
                </h2>
                <p className="max-w-sm text-sm leading-relaxed text-[#F8F5EF]/70">
                  Sign in to follow each piece from our cutting table to your
                  doorstep — and to keep your fit profile ready for every
                  bespoke commission.
                </p>
              </div>

              <ul className="relative space-y-4 pt-10 text-[11px] uppercase tracking-[0.18em] text-[#F8F5EF]/80">
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#E8CE9C]" />
                  <span>Track every order in real time</span>
                </li>
                <li className="flex items-center gap-3">
                  <Scissors className="h-4 w-4 shrink-0 text-[#E8CE9C]" />
                  <span>Save your atelier measurements</span>
                </li>
                <li className="flex items-center gap-3">
                  <Package className="h-4 w-4 shrink-0 text-[#E8CE9C]" />
                  <span>Faster checkout, saved delivery details</span>
                </li>
              </ul>
            </div>

            {/* Auth form panel */}
            <div className="relative p-7 sm:p-10">
              <div className="space-y-2 text-center">
                <StitchRule
                  charm="scissors"
                  className="mx-auto max-w-[200px] text-[#C6A15B]/70"
                />
                <p className="text-xs uppercase tracking-[0.2em] text-[#7A1F3D]">
                  {page.eyebrow}
                </p>
                <h1 className="font-serif text-3xl text-[#292725] sm:text-4xl">
                  {authMode === "login" ? page.signInTitle : page.registerTitle}
                </h1>
                <p className="text-xs leading-relaxed text-[#6E6A64]">
                  {page.intro}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-2 border border-[#E5DEC9] bg-[#F8F5EF] p-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("login");
                    setAuthError(null);
                  }}
                  className={`py-2.5 text-xs uppercase tracking-[0.15em] transition-colors ${
                    authMode === "login"
                      ? "bg-[#7A1F3D] text-[#F8F5EF]"
                      : "text-[#292725] hover:text-[#7A1F3D]"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("register");
                    setAuthError(null);
                  }}
                  className={`py-2.5 text-xs uppercase tracking-[0.15em] transition-colors ${
                    authMode === "register"
                      ? "bg-[#7A1F3D] text-[#F8F5EF]"
                      : "text-[#292725] hover:text-[#7A1F3D]"
                  }`}
                >
                  Register
                </button>
              </div>

              {authError && (
                <div className="mt-4 flex items-center gap-2 border border-[#9E3B3B] bg-[#9E3B3B]/10 p-3 text-xs text-[#9E3B3B]">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="mt-5 space-y-4">
                {authMode === "register" && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-wider text-[#292725]">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Samira Chowdhury"
                        className="w-full border border-[#E5DEC9] bg-[#F8F5EF] px-3.5 py-2.5 text-sm text-[#292725] focus:outline-none focus:border-[#7A1F3D]"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs uppercase tracking-wider text-[#292725]">
                          Phone *
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="01712345678"
                          className="w-full border border-[#E5DEC9] bg-[#F8F5EF] px-3.5 py-2.5 text-sm text-[#292725] focus:outline-none focus:border-[#7A1F3D]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs uppercase tracking-wider text-[#292725]">
                          WhatsApp
                        </label>
                        <input
                          type="tel"
                          value={whatsapp}
                          onChange={(e) => setWhatsapp(e.target.value)}
                          placeholder="+8801712345678"
                          className="w-full border border-[#E5DEC9] bg-[#F8F5EF] px-3.5 py-2.5 text-sm text-[#292725] focus:outline-none focus:border-[#7A1F3D]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs uppercase tracking-wider text-[#292725]">
                        Delivery Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="House, Road, Area, Dhaka"
                        className="w-full border border-[#E5DEC9] bg-[#F8F5EF] px-3.5 py-2.5 text-sm text-[#292725] focus:outline-none focus:border-[#7A1F3D]"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="mb-1 block text-xs uppercase tracking-wider text-[#292725]">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-[#E5DEC9] bg-[#F8F5EF] px-3.5 py-2.5 text-sm text-[#292725] focus:outline-none focus:border-[#7A1F3D]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs uppercase tracking-wider text-[#292725]">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-[#E5DEC9] bg-[#F8F5EF] px-3.5 py-2.5 text-sm text-[#292725] focus:outline-none focus:border-[#7A1F3D]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-sheen w-full cursor-pointer bg-[#7A1F3D] py-3.5 text-xs uppercase tracking-[0.18em] text-[#F8F5EF] transition-colors hover:bg-[#61182F]"
                >
                  {loading
                    ? "Please wait..."
                    : authMode === "login"
                    ? "Sign In to Account"
                    : "Create Account"}
                </button>
              </form>
            </div>
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
      <div className="relative max-w-[1200px] mx-auto px-5 sm:px-8 space-y-10">
        {/* Header */}
        <div className="border-b border-[#E5DEC9] pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#7A1F3D]">
              {page.dashboardEyebrow}
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl text-[#292725] mt-1">
              Welcome, {customer.name}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => {
              setCustomer(null);
              showToast("Signed out of your account");
            }}
            className="inline-flex items-center gap-2 border border-[#292725] text-[#292725] px-5 py-2.5 text-xs uppercase tracking-[0.15em] hover:bg-[#292725] hover:text-[#F8F5EF] transition-colors self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 overflow-x-auto border-b border-[#E5DEC9]">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-2 pb-3.5 text-xs uppercase tracking-[0.16em] transition-colors ${
              activeTab === "orders"
                ? "border-[#7A1F3D] text-[#7A1F3D] font-medium"
                : "border-transparent text-[#6E6A64] hover:text-[#292725]"
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Order History ({orders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-2 pb-3.5 text-xs uppercase tracking-[0.16em] transition-colors ${
              activeTab === "profile"
                ? "border-[#7A1F3D] text-[#7A1F3D] font-medium"
                : "border-transparent text-[#6E6A64] hover:text-[#292725]"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Account Details &amp; Saved Fit</span>
          </button>
        </div>

        {/* Tab 1: Order History & Order Details */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="bg-white border border-[#E5DEC9] p-12 text-center space-y-4 shadow-[0_18px_40px_rgba(41,39,37,0.08)]">
                <StitchRule
                  charm="scissors"
                  className="mx-auto max-w-[200px] text-[#C6A15B]/70"
                />
                <p className="font-serif text-2xl text-[#292725]">
                  You have not placed any orders yet
                </p>
                <Link
                  href="/shop"
                  className="inline-block bg-[#7A1F3D] btn-sheen text-[#F8F5EF] px-6 py-3 text-xs uppercase tracking-[0.16em]"
                >
                  Explore Collection
                </Link>
                <StitchRule charm="none" className="text-[#C6A15B]/70" />
              </div>
            ) : (
              <div className="space-y-5">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white border border-[#E5DEC9] p-6 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5DEC9]">
                      <div>
                        <span className="font-mono text-xs text-[#7A1F3D] font-medium">
                          Order #{order.orderNumber}
                        </span>
                        <p className="text-xs text-[#6E6A64] mt-0.5">
                          Placed on{" "}
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}{" "}
                          &middot; {order.paymentMethod}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className="px-3 py-1 bg-[#EFECE4] border border-[#E5DEC9] text-xs uppercase tracking-wider text-[#292725]">
                          {order.status}
                        </span>
                        <span className="font-serif text-2xl text-[#7A1F3D]">
                          {formatPrice(order.total)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedOrder(
                              selectedOrder?.id === order.id ? null : order
                            )
                          }
                          className="px-3 py-1.5 border border-[#292725] text-xs uppercase tracking-wider text-[#292725] hover:bg-[#292725] hover:text-[#F8F5EF] transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>
                            {selectedOrder?.id === order.id
                              ? "Hide Details"
                              : "View Details"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Expanded Order Details */}
                    {selectedOrder?.id === order.id && (
                      <div className="pt-2 space-y-4 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-[#F8F5EF] p-4 border border-[#E5DEC9]">
                          <div>
                            <p className="uppercase tracking-wider text-[#6E6A64]">
                              Delivery Address
                            </p>
                            <p className="text-[#292725] font-medium mt-1">
                              {order.deliveryAddress} ({order.deliveryZone})
                            </p>
                          </div>
                          <div>
                            <p className="uppercase tracking-wider text-[#6E6A64]">
                              Contact &amp; Payment
                            </p>
                            <p className="text-[#292725] font-medium mt-1">
                              WhatsApp: {order.whatsapp} &middot;{" "}
                              {order.paymentMethod}
                            </p>
                          </div>
                        </div>

                        <div className="divide-y divide-[#E5DEC9] border border-[#E5DEC9]">
                          {order.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex flex-wrap items-center justify-between gap-3 p-4"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-16 w-12 shrink-0 object-cover border border-[#E5DEC9]"
                                />
                                <div className="min-w-0">
                                  <p className="font-serif text-lg text-[#292725]">
                                    {item.name}
                                  </p>
                                  <p className="text-xs text-[#6E6A64]">
                                    {item.purchaseMode} &middot;{" "}
                                    {item.selectedColor} &middot;{" "}
                                    {item.selectedSize} &times; {item.quantity}
                                  </p>
                                </div>
                              </div>
                              <span className="shrink-0 text-sm font-medium text-[#292725]">
                                {formatPrice(item.unitPrice * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Account Information & Saved Measurements */}
        {activeTab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <form
              onSubmit={handleProfileUpdate}
              className="lg:col-span-7 bg-white border border-[#E5DEC9] shadow-[0_18px_40px_rgba(41,39,37,0.08)] p-6 sm:p-8 space-y-5"
            >
              <h2 className="font-serif text-2xl text-[#292725] border-b border-[#E5DEC9] pb-3">
                Basic Account Information
              </h2>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profPhone}
                    onChange={(e) => setProfPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    value={profWhatsapp}
                    onChange={(e) => setProfWhatsapp(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                  Default Delivery Address
                </label>
                <textarea
                  rows={3}
                  value={profAddress}
                  onChange={(e) => setProfAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-7 py-3.5 bg-[#7A1F3D] btn-sheen text-[#F8F5EF] text-xs uppercase tracking-[0.16em] hover:bg-[#61182F] transition-colors cursor-pointer"
              >
                {loading ? "Saving..." : "Save Account Changes"}
              </button>
            </form>

            {/* Saved Measurement Dossier Card */}
            <div className="lg:col-span-5 bg-[#EFECE4] border border-[#E5DEC9] p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between gap-3 border-b border-[#E5DEC9] pb-3">
                <h2 className="min-w-0 font-serif text-2xl text-[#292725]">
                  Saved Atelier Measurements
                </h2>
                <Scissors className="h-4 w-4 shrink-0 text-[#7A1F3D]" />
              </div>

              {customer.savedMeasurements &&
              Object.keys(customer.savedMeasurements).length > 0 ? (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {Object.entries(customer.savedMeasurements).map(
                    ([k, val]) =>
                      val ? (
                        <div
                          key={k}
                          className="p-2.5 bg-[#F8F5EF] border border-[#E5DEC9]"
                        >
                          <span className="uppercase tracking-wider text-[10px] text-[#6E6A64] block">
                            {k}
                          </span>
                          <span className="font-mono text-sm text-[#292725]">
                            {val}{" "}
                            {k !== "neckStyle"
                              ? customer.measurementUnit || "inches"
                              : ""}
                          </span>
                        </div>
                      ) : null
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#6E6A64]">
                  No saved measurements yet. Visit our Custom Tailoring Studio
                  to create a custom order.
                </p>
              )}

              <Link
                href="/customize"
                className="inline-flex items-center justify-center gap-2 w-full bg-[#7A1F3D] btn-sheen text-[#F8F5EF] py-3.5 px-5 text-xs uppercase tracking-[0.16em]"
              >
                <Scissors className="w-4 h-4" />
                <span>Order Custom Tailored Outfit</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
