"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Package,
  Scissors,
  ShoppingBag,
  Settings,
  Plus,
  Trash2,
  Edit3,
  Upload,
  Check,
  X,
  MessageCircle,
  Image as ImageIcon,
  LogOut,
  ExternalLink,
  Users,
} from "lucide-react";
import Link from "next/link";
import { ContentManager } from "./ContentManager";
import {
  ADMIN_DRAFT_EVENT,
  clearAdminDraft,
  draftSummaryCount,
  getAdminDraft,
  getDraftSummary,
  updateProductsDraft,
  updateSettingsDraft,
  type DraftSummary,
} from "@/lib/adminDrafts";
import {
  useStore,
  formatPrice,
  type ProductRecord,
  type StoreSettingsRecord,
} from "@/context/StoreContext";
import type { OrderItemPayload, MeasurementMap } from "@/db/schema";

interface AdminOrderRecord {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  phone: string;
  whatsapp: string;
  deliveryAddress: string;
  deliveryZone: string;
  orderNotes?: string;
  paymentMethod: string;
  paymentTransactionId?: string;
  items: OrderItemPayload[];
  subtotal: number;
  deliveryCharge: number;
  total: number;
  status: string;
  createdAt: string;
}

interface AdminCustomerRecord {
  id: number;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  createdAt: string;
  hasSavedMeasurements: boolean;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

interface AdminTailoringRecord {
  id: number;
  requestNumber: string;
  category: string;
  productId?: number;
  productName: string;
  productImage?: string;
  selectedColor?: string;
  tailoringOption: string;
  unit: string;
  measurements: MeasurementMap;
  referenceImageName?: string;
  referenceImageData?: string;
  specialNotes?: string;
  customerName: string;
  whatsappNumber: string;
  deliveryAddress: string;
  additionalInstructions?: string;
  status: string;
  createdAt: string;
}

/** fetch wrapper: if the admin session expires, return to the login gate. */
async function adminFetch(input: string, init?: RequestInit) {
  const response = await fetch(input, init);
  if (response.status === 401 && typeof window !== "undefined") {
    window.location.reload();
  }
  return response;
}

const ORDER_STATUSES = [
  "Pending",
  "Confirmed",
  "In Tailoring",
  "Dispatched",
  "Delivered",
  "Cancelled",
];

function slugifyProductName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "piece"
  );
}

const TAILORING_STATUSES = [
  "New Request",
  "Measurements Verified",
  "On Cutting Table",
  "Stitching & Finishing",
  "Completed",
];

export function AdminDashboard() {
  const { settings, refreshSettings, setContent, showToast } = useStore();

  const [activeTab, setActiveTab] = useState<
    "products" | "tailoring" | "orders" | "customers" | "content" | "settings"
  >("products");

  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [deletedProductIds, setDeletedProductIds] = useState<number[]>([]);
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [customers, setCustomers] = useState<AdminCustomerRecord[]>([]);
  const [tailoringRequests, setTailoringRequests] = useState<
    AdminTailoringRecord[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Product Form Modal / Drawer State
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(
    null
  );
  const [showProductForm, setShowProductForm] = useState(false);
  const [prodName, setProdName] = useState("");
  const [prodCategory, setProdCategory] = useState<
    "Three Piece" | "Two Piece" | "Tops"
  >("Three Piece");
  const [prodPrice, setProdPrice] = useState("7500");
  const [prodStitchingFee, setProdStitchingFee] = useState("1400");
  const [prodDescription, setProdDescription] = useState("");
  const [prodFabricDetails, setProdFabricDetails] = useState("");
  const [prodCare, setProdCare] = useState("");
  const [prodColors, setProdColors] = useState("Deep Wine, Warm Ivory");
  const [prodSizes, setProdSizes] = useState("Unstitched, Custom Stitched");
  const [prodImages, setProdImages] = useState<string[]>([
    "/images/collection-three-piece.jpg",
  ]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [prodInStock, setProdInStock] = useState(true);
  const [prodStockCount, setProdStockCount] = useState("10");
  const [prodFeatured, setProdFeatured] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("All");

  // Orders tab: search & status filters
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("All");

  // Settings Form State
  const [settingsForm, setSettingsForm] =
    useState<StoreSettingsRecord>(settings);

  // Publish workflow: edits live in localStorage until "Save & Publish".
  const [publishing, setPublishing] = useState(false);
  const [draftSummary, setDraftSummary] = useState<DraftSummary>({
    contentPages: 0,
    settings: false,
    products: false,
  });
  const pendingCount = draftSummaryCount(draftSummary);

  const refreshDraftSummary = useCallback(() => {
    setDraftSummary(getDraftSummary());
  }, []);

  useEffect(() => {
    refreshDraftSummary();
    window.addEventListener(ADMIN_DRAFT_EVENT, refreshDraftSummary);
    return () =>
      window.removeEventListener(ADMIN_DRAFT_EVENT, refreshDraftSummary);
  }, [refreshDraftSummary]);

  useEffect(() => {
    const draft = getAdminDraft().settings;
    setSettingsForm(
      draft && JSON.stringify(draft) !== JSON.stringify(settings)
        ? { ...settings, ...draft }
        : settings
    );
  }, [settings]);

  // Keep settings edits in the local draft (never the live database).
  useEffect(() => {
    if (JSON.stringify(settingsForm) === JSON.stringify(settings)) return;
    updateSettingsDraft(settingsForm);
  }, [settingsForm, settings]);

  const loadAllAdminData = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, oRes, tRes, cRes] = await Promise.all([
        adminFetch("/api/products", { cache: "no-store" }),
        adminFetch("/api/orders", { cache: "no-store" }),
        adminFetch("/api/tailoring", { cache: "no-store" }),
        adminFetch("/api/customers", { cache: "no-store" }),
      ]);
      if (pRes.ok) {
        const pData = await pRes.json();
        const draftProducts = getAdminDraft().products;
        if (draftProducts) {
          setProducts(draftProducts.items ?? []);
          setDeletedProductIds(draftProducts.deletedIds ?? []);
        } else {
          setProducts(pData.products || []);
          setDeletedProductIds([]);
        }
      }
      if (oRes.ok) {
        const oData = await oRes.json();
        setOrders(oData.orders || []);
      }
      if (tRes.ok) {
        const tData = await tRes.json();
        setTailoringRequests(tData.requests || []);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        setCustomers(cData.customers || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllAdminData();
  }, [loadAllAdminData]);

  const openCreateProduct = () => {
    setEditingProduct(null);
    setProdName("");
    setProdCategory("Three Piece");
    setProdPrice("7800");
    setProdStitchingFee("1400");
    setProdDescription(
      "Handcrafted in our Dhaka atelier from pure artisanal textiles."
    );
    setProdFabricDetails(
      "Kameez: Pure Handloom Silk (3 yds) | Trouser: Raw Silk (2.5 yds) | Dupatta: Silk Organza (2.75 yds)"
    );
    setProdCare("Dry clean only. Store in breathable muslin.");
    setProdColors("Deep Wine, Warm Ivory, Soft Sage");
    setProdSizes("Unstitched, Custom Stitched");
    setProdImages(["/images/collection-three-piece.jpg"]);
    setProdInStock(true);
    setProdStockCount("10");
    setProdFeatured(false);
    setShowProductForm(true);
  };

  const openEditProduct = (p: ProductRecord) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdCategory(p.category);
    setProdPrice(String(p.price));
    setProdStitchingFee(String(p.stitchingFee));
    setProdDescription(p.description);
    setProdFabricDetails(p.fabricDetails);
    setProdCare(p.careInstructions);
    setProdColors(p.colors.join(", "));
    setProdSizes(p.sizes.join(", "));
    setProdImages(
      p.images.length > 0 ? p.images : ["/images/collection-three-piece.jpg"]
    );
    setProdInStock(p.inStock);
    setProdStockCount(String(p.stockCount));
    setProdFeatured(p.featured);
    setShowProductForm(true);
  };

  const [uploadingImage, setUploadingImage] = useState(false);

  const handleProductImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await adminFetch("/api/media", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Image upload failed");
        return;
      }
      setProdImages((prev) => [data.url, ...prev]);
      showToast(`Uploaded "${file.name}"`);
    } catch {
      showToast("Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const commitProducts = (next: ProductRecord[], deletedIds = deletedProductIds) => {
    setProducts(next);
    setDeletedProductIds(deletedIds);
    updateProductsDraft(next, deletedIds);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: ProductRecord = {
      id: editingProduct?.id ?? -Date.now(),
      slug: editingProduct?.slug ?? `${slugifyProductName(prodName)}-draft`,
      name: prodName.trim(),
      category: prodCategory,
      price: Number(prodPrice) || 0,
      stitchingFee: Number(prodStitchingFee) || 0,
      description: prodDescription,
      fabricDetails: prodFabricDetails,
      careInstructions: prodCare,
      colors: prodColors
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      sizes: prodSizes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      images: prodImages.filter(Boolean),
      inStock: prodInStock,
      stockCount: Number(prodStockCount) || 0,
      featured: prodFeatured,
      supportsUnstitched: prodCategory === "Three Piece",
      supportsCustomTailoring: true,
    };

    const next = editingProduct
      ? products.map((p) => (p.id === editingProduct.id ? payload : p))
      : [payload, ...products];

    commitProducts(next);
    setShowProductForm(false);
    showToast(
      editingProduct
        ? `"${prodName}" saved as draft — publish to make it live`
        : `"${prodName}" added as draft — publish to make it live`
    );
  };

  const handleDeleteProduct = (id: number, name: string) => {
    const nextDeleted =
      id > 0 && !deletedProductIds.includes(id)
        ? [...deletedProductIds, id]
        : deletedProductIds;
    commitProducts(
      products.filter((p) => p.id !== id),
      nextDeleted
    );
    showToast(`"${name}" will be deleted when you publish`);
  };

  const handleQuickToggleStock = (p: ProductRecord) => {
    commitProducts(
      products.map((item) =>
        item.id === p.id ? { ...item, inStock: !p.inStock } : item
      )
    );
    showToast(
      `"${p.name}" marked ${!p.inStock ? "In Stock" : "Out of Stock"} in draft`
    );
  };

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    try {
      const res = await adminFetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
        showToast(`Order status updated to "${status}"`);
      }
    } catch {
      // ignore
    }
  };

  // Orders tab: search + status filtering with live counts
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      orderStatusFilter === "All" || order.status === orderStatusFilter;
    const query = orderSearch.trim().toLowerCase();
    const matchesSearch =
      query === "" ||
      [
        order.orderNumber,
        order.customerName,
        order.phone,
        order.whatsapp,
        order.customerEmail,
        order.paymentMethod,
        order.paymentTransactionId,
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  const handleUpdateTailoringStatus = async (
    reqId: number,
    status: string
  ) => {
    try {
      const res = await adminFetch(`/api/tailoring/${reqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setTailoringRequests((prev) =>
          prev.map((r) => (r.id === reqId ? { ...r, status } : r))
        );
        showToast(`Tailoring request updated to "${status}"`);
      }
    } catch {
      // ignore
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsDraft(settingsForm);
    showToast("Settings saved as draft — press Save & Publish to go live");
  };

  const handlePublish = async () => {
    const draft = getAdminDraft();
    if (!draft.content && !draft.settings && !draft.products) {
      showToast("There are no draft changes to publish");
      return;
    }
    setPublishing(true);
    try {
      const res = await adminFetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(data.error || "Publishing failed");
        return;
      }
      clearAdminDraft();
      if (data.published?.products) {
        setProducts(data.published.products);
        setDeletedProductIds([]);
      }
      if (data.published?.content) {
        setContent(data.published.content);
      }
      if (data.published?.settings) {
        setSettingsForm(data.published.settings);
        await refreshSettings();
      }
      await loadAllAdminData();
      showToast(
        data.commitSha
          ? "Published to GitHub — a new Vercel deployment has started"
          : "Published — your changes are now live on the website"
      );
    } catch {
      showToast("Publishing failed. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    window.location.reload();
  };

  const filteredProducts = products.filter(
    (p) => categoryFilter === "All" || p.category === categoryFilter
  );

  return (
    <div className="bg-[#F8F5EF] min-h-screen py-12 lg:py-16">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-14 space-y-10">
        {/* Header & KPI Bar */}
        <div className="border-b border-[#E5DEC9] pb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#7A1F3D]">
              Business Owner Management Studio
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-1.5 border border-[#E5DEC9] bg-white px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-[#292725] hover:border-[#7A1F3D]"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>View Live Site</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 border border-[#7A1F3D] px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-[#7A1F3D] hover:bg-[#7A1F3D] hover:text-[#F8F5EF]"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl text-[#292725] mt-1">
              Reshma&rsquo;s Needle Atelier Dashboard
            </h1>
            <p className="text-sm text-[#6E6A64] mt-1">
              Manage your Three Piece, Two Piece, and Tops catalog, edit the
              text and images on every page, inspect custom measurement cards,
              update customer orders, and configure WhatsApp &amp; bKash/Nagad
              instructions.
            </p>
          </div>

          <div className="grid w-full shrink-0 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 lg:w-auto">
            <div className="bg-white border border-[#E5DEC9] px-4 py-3 sm:px-5 sm:py-3.5">
              <p className="text-[10px] uppercase tracking-wider text-[#6E6A64]">
                Catalog Pieces
              </p>
              <p className="font-serif text-2xl text-[#292725] mt-0.5">
                {products.length}
              </p>
            </div>
            <div className="bg-white border border-[#E5DEC9] px-4 py-3 sm:px-5 sm:py-3.5">
              <p className="text-[10px] uppercase tracking-wider text-[#7A1F3D]">
                Bespoke Requests
              </p>
              <p className="font-serif text-2xl text-[#7A1F3D] mt-0.5">
                {tailoringRequests.length}
              </p>
            </div>
            <div className="bg-white border border-[#E5DEC9] px-4 py-3 sm:px-5 sm:py-3.5">
              <p className="text-[10px] uppercase tracking-wider text-[#6E6A64]">
                Customer Orders
              </p>
              <p className="font-serif text-2xl text-[#292725] mt-0.5">
                {orders.length}
              </p>
            </div>
          </div>
        </div>

        {/* Draft / Publish bar: nothing here touches the live site yet. */}
        <div className="flex flex-col gap-4 border border-[#E5DEC9] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                pendingCount > 0 ? "bg-[#C6A15B]" : "bg-[#7CA982]"
              }`}
            />
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#292725]">
                {pendingCount > 0
                  ? `${pendingCount} unpublished ${
                      pendingCount === 1 ? "change" : "changes"
                    }`
                  : "Website is up to date"}
              </p>
              <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-[#6E6A64]">
                {pendingCount > 0
                  ? "Content, settings and catalogue edits are saved as a draft in this browser. Nothing is visible on the live site until you press Save & Publish."
                  : "Content, settings and catalogue edits stay as drafts until you press Save & Publish. Order and tailoring statuses update instantly."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePublish}
            disabled={pendingCount === 0 || publishing}
            className="inline-flex shrink-0 items-center justify-center gap-2 bg-[#7A1F3D] px-7 py-3.5 text-xs uppercase tracking-[0.16em] text-[#F8F5EF] transition-colors hover:bg-[#61182F] disabled:opacity-40"
          >
            {publishing ? "Publishing..." : "Save & Publish"}
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#E5DEC9] pb-4">
          {[
            {
              id: "products",
              label: `1. Products & Categories (${products.length})`,
              icon: Package,
            },
            {
              id: "tailoring",
              label: `2. Custom Tailoring Requests (${tailoringRequests.length})`,
              icon: Scissors,
            },
            {
              id: "orders",
              label: `3. Customer Orders (${orders.length})`,
              icon: ShoppingBag,
            },
            {
              id: "customers",
              label: `4. Registered Customers (${customers.length})`,
              icon: Users,
            },
            {
              id: "content",
              label: "5. Page Content & Images",
              icon: ImageIcon,
            },
            {
              id: "settings",
              label: "6. WhatsApp, Delivery & Payment",
              icon: Settings,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() =>
                  setActiveTab(
                    tab.id as "products" | "tailoring" | "orders" | "customers" | "content" | "settings"
                  )
                }
                className={`px-5 py-3 text-xs uppercase tracking-[0.15em] border transition-colors inline-flex items-center gap-2 ${
                  active
                    ? "bg-[#7A1F3D] border-[#7A1F3D] text-[#F8F5EF]"
                    : "bg-white border-[#E5DEC9] text-[#292725] hover:border-[#7A1F3D]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: PRODUCTS MANAGEMENT */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {["All", "Three Piece", "Two Piece", "Tops"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-2 text-xs uppercase tracking-wider border ${
                      categoryFilter === cat
                        ? "border-[#292725] bg-[#292725] text-[#F8F5EF]"
                        : "border-[#E5DEC9] bg-white text-[#292725]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={openCreateProduct}
                className="inline-flex items-center gap-2 bg-[#7A1F3D] hover:bg-[#61182F] text-[#F8F5EF] px-6 py-3 text-xs uppercase tracking-[0.16em]"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </button>
            </div>

            {/* Product Add / Edit Form Drawer */}
            {showProductForm && (
              <form
                onSubmit={handleSaveProduct}
                className="bg-white border-2 border-[#7A1F3D] p-6 sm:p-8 space-y-6 shadow-lg"
              >
                <div className="flex items-start justify-between gap-4 border-b border-[#E5DEC9] pb-4">
                  <h2 className="min-w-0 font-serif text-2xl text-[#292725] sm:text-3xl">
                    {editingProduct
                      ? `Edit Product: ${editingProduct.name}`
                      : "Add New Boutique Product"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowProductForm(false)}
                    className="p-2 text-[#6E6A64] hover:text-[#292725]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      placeholder="e.g., Zoya Organza Three Piece"
                      className="w-full px-3.5 py-2.5 bg-[#F8F5EF] border border-[#E5DEC9] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                      Category *
                    </label>
                    <select
                      value={prodCategory}
                      onChange={(e) => {
                        const cat = e.target.value as
                          | "Three Piece"
                          | "Two Piece"
                          | "Tops";
                        setProdCategory(cat);
                        if (cat === "Three Piece") {
                          setProdSizes("Unstitched, Custom Stitched");
                        } else {
                          setProdSizes("XS, S, M, L, XL, Custom Tailored");
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-[#F8F5EF] border border-[#E5DEC9] text-sm"
                    >
                      <option value="Three Piece">Three Piece</option>
                      <option value="Two Piece">Two Piece</option>
                      <option value="Tops">Tops</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                        Base Price (৳) *
                      </label>
                      <input
                        type="number"
                        required
                        value={prodPrice}
                        onChange={(e) => setProdPrice(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#F8F5EF] border border-[#E5DEC9] font-mono text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                        Stitching Fee (৳)
                      </label>
                      <input
                        type="number"
                        value={prodStitchingFee}
                        onChange={(e) => setProdStitchingFee(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#F8F5EF] border border-[#E5DEC9] font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                      Available Shades / Colors (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={prodColors}
                      onChange={(e) => setProdColors(e.target.value)}
                      placeholder="Deep Wine, Warm Ivory, Soft Sage"
                      className="w-full px-3.5 py-2.5 bg-[#F8F5EF] border border-[#E5DEC9] text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                      Available Sizes / Options (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={prodSizes}
                      onChange={(e) => setProdSizes(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F8F5EF] border border-[#E5DEC9] text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 items-center gap-x-4 gap-y-3 pt-0 sm:grid-cols-3 md:pt-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#292725] mb-1">
                        Stock Qty
                      </label>
                      <input
                        type="number"
                        value={prodStockCount}
                        onChange={(e) => setProdStockCount(e.target.value)}
                        className="w-full px-2.5 py-2 bg-[#F8F5EF] border border-[#E5DEC9] font-mono text-xs"
                      />
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prodInStock}
                        onChange={(e) => setProdInStock(e.target.checked)}
                        className="accent-[#7A1F3D]"
                      />
                      <span>In Stock</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={prodFeatured}
                        onChange={(e) => setProdFeatured(e.target.checked)}
                        className="accent-[#7A1F3D]"
                      />
                      <span>Featured</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                      Editorial Description
                    </label>
                    <textarea
                      rows={3}
                      value={prodDescription}
                      onChange={(e) => setProdDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F8F5EF] border border-[#E5DEC9] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                      Fabric &amp; Craftsmanship Details
                    </label>
                    <textarea
                      rows={3}
                      value={prodFabricDetails}
                      onChange={(e) => setProdFabricDetails(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#F8F5EF] border border-[#E5DEC9] text-sm"
                    />
                  </div>
                </div>

                {/* Image Upload & Gallery Manager */}
                <div className="space-y-3 pt-2 border-t border-[#E5DEC9]">
                  <label className="block text-xs uppercase tracking-wider text-[#292725]">
                    Product Photography (Upload File or Add Image Path)
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#EFECE4] border border-[#7A1F3D]/40 text-xs uppercase tracking-wider text-[#292725] cursor-pointer hover:border-[#7A1F3D]">
                      <Upload className="w-4 h-4 text-[#7A1F3D]" />
                      <span>{uploadingImage ? "Uploading..." : "Upload Image File"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProductImageUpload}
                        className="hidden"
                      />
                    </label>

                    <div className="flex min-w-0 flex-1 basis-full items-center gap-2 sm:basis-auto">
                      <input
                        type="text"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="Or paste image URL / path (e.g. /images/product-velvet-wine.jpg)"
                        className="flex-1 px-3 py-2 bg-[#F8F5EF] border border-[#E5DEC9] text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newImageUrl.trim()) {
                            setProdImages((prev) => [
                              ...prev,
                              newImageUrl.trim(),
                            ]);
                            setNewImageUrl("");
                          }
                        }}
                        className="px-4 py-2 bg-[#292725] text-[#F8F5EF] text-xs uppercase tracking-wider"
                      >
                        Add URL
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-2">
                    {prodImages.map((img, i) => (
                      <div
                        key={i}
                        className="relative w-20 h-24 border border-[#E5DEC9] bg-[#EFECE4] group"
                      >
                        <img
                          src={img}
                          alt="Product preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setProdImages((prev) =>
                              prev.filter((_, idx) => idx !== i)
                            )
                          }
                          className="absolute top-1 right-1 bg-[#292725]/80 text-white p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#E5DEC9]">
                  <button
                    type="button"
                    onClick={() => setShowProductForm(false)}
                    className="px-6 py-3 border border-[#292725] text-xs uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-[#7A1F3D] text-[#F8F5EF] text-xs uppercase tracking-[0.16em]"
                  >
                    {editingProduct ? "Save Product Draft" : "Add Product Draft"}
                  </button>
                </div>
              </form>
            )}

            {/* Products Table */}
            <div className="bg-white border border-[#E5DEC9] overflow-x-auto">
              <table className="w-full min-w-[760px] text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E5DEC9] bg-[#EFECE4]/60 text-[11px] uppercase tracking-[0.15em] text-[#6E6A64]">
                    <th className="p-4">Piece</th>
                    <th className="p-4">Category</th>
                    <th className="p-4">Price / Stitching</th>
                    <th className="p-4">Variations</th>
                    <th className="p-4">Stock Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DEC9] text-sm">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F8F5EF]/60">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              p.images[0] ||
                              "/images/collection-three-piece.jpg"
                            }
                            alt={p.name}
                            className="w-12 h-16 object-cover border border-[#E5DEC9] shrink-0"
                          />
                          <div>
                            <p className="font-serif text-lg text-[#292725]">
                              {p.name}
                            </p>
                            {p.featured && (
                              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[#7A1F3D]/10 text-[#7A1F3D]">
                                Featured Homepage
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-xs uppercase tracking-wider text-[#7A1F3D]">
                        {p.category}
                      </td>
                      <td className="p-4">
                        <p className="font-medium text-[#292725]">
                          {formatPrice(p.price)}
                        </p>
                        <p className="text-xs text-[#6E6A64]">
                          +{formatPrice(p.stitchingFee)} custom stitch
                        </p>
                      </td>
                      <td className="p-4 text-xs text-[#6E6A64]">
                        <p>Colors: {p.colors.join(", ")}</p>
                        <p className="mt-0.5">Sizes: {p.sizes.join(", ")}</p>
                      </td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleQuickToggleStock(p)}
                          className={`px-3 py-1 text-xs uppercase tracking-wider border ${
                            p.inStock
                              ? "border-[#4A6B53] bg-[#4A6B53]/10 text-[#4A6B53]"
                              : "border-[#9E3B3B] bg-[#9E3B3B]/10 text-[#9E3B3B]"
                          }`}
                        >
                          {p.inStock
                            ? `In Stock (${p.stockCount})`
                            : "Out of Stock"}
                        </button>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => openEditProduct(p)}
                          className="p-2 border border-[#E5DEC9] hover:border-[#7A1F3D] text-[#292725]"
                          title="Edit product"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          className="p-2 border border-[#E5DEC9] hover:border-[#9E3B3B] text-[#9E3B3B]"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOM TAILORING REQUESTS */}
        {activeTab === "tailoring" && (
          <div className="space-y-6">
            {tailoringRequests.length === 0 ? (
              <div className="bg-white border border-[#E5DEC9] p-12 text-center">
                <p className="font-serif text-2xl text-[#292725]">
                  No custom tailoring requests yet
                </p>
              </div>
            ) : (
              tailoringRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-white border border-[#E5DEC9] p-6 sm:p-8 space-y-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5DEC9]">
                    <div className="flex min-w-0 items-center gap-4">
                      {req.productImage && (
                        <img
                          src={req.productImage}
                          alt={req.productName}
                          className="w-16 h-20 object-cover border border-[#E5DEC9]"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[#7A1F3D] font-medium">
                            {req.requestNumber}
                          </span>
                          <span className="text-xs text-[#6E6A64]">
                            &middot;{" "}
                            {new Date(req.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="font-serif text-2xl text-[#292725]">
                          {req.productName} ({req.category})
                        </h3>
                        <p className="text-xs text-[#6E6A64]">
                          Shade: <strong>{req.selectedColor || "Standard"}</strong>{" "}
                          &middot; Client: <strong>{req.customerName}</strong> (
                          {req.whatsappNumber})
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        value={req.status}
                        onChange={(e) =>
                          handleUpdateTailoringStatus(req.id, e.target.value)
                        }
                        className="px-3.5 py-2 bg-[#F8F5EF] border border-[#7A1F3D] text-xs uppercase tracking-wider text-[#292725]"
                      >
                        {TAILORING_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>

                      <a
                        href={`https://wa.me/${req.whatsappNumber.replace(
                          /[^0-9]/g,
                          ""
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7A1F3D] text-[#F8F5EF] text-xs uppercase tracking-wider"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Message Client</span>
                      </a>
                    </div>
                  </div>

                  {/* Customer Measurements Grid */}
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[#292725] font-medium mb-3">
                      Customer Body Measurements ({req.unit})
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      {Object.entries(req.measurements || {}).map(
                        ([key, val]) =>
                          val ? (
                            <div
                              key={key}
                              className="p-2.5 bg-[#F8F5EF] border border-[#E5DEC9]"
                            >
                              <span className="text-[10px] uppercase tracking-wider text-[#6E6A64] block">
                                {key}
                              </span>
                              <span className="font-mono text-xs text-[#292725] font-medium">
                                {val} {key !== "neckStyle" ? req.unit : ""}
                              </span>
                            </div>
                          ) : null
                      )}
                    </div>
                  </div>

                  {/* Tailoring Notes, Delivery Address & Reference Image */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                    <div className="p-4 bg-[#F8F5EF] border border-[#E5DEC9]">
                      <p className="uppercase tracking-wider text-[#6E6A64] mb-1">
                        Tailoring Notes &amp; Instructions
                      </p>
                      <p className="text-[#292725]">
                        {req.specialNotes || "No special tailoring notes."}
                      </p>
                      {req.additionalInstructions && (
                        <p className="text-[#7A1F3D] mt-1">
                          Note: {req.additionalInstructions}
                        </p>
                      )}
                    </div>

                    <div className="p-4 bg-[#F8F5EF] border border-[#E5DEC9]">
                      <p className="uppercase tracking-wider text-[#6E6A64] mb-1">
                        Client Delivery Address
                      </p>
                      <p className="text-[#292725]">{req.deliveryAddress}</p>
                    </div>

                    <div className="p-4 bg-[#F8F5EF] border border-[#E5DEC9]">
                      <p className="uppercase tracking-wider text-[#6E6A64] mb-1">
                        Uploaded Reference Image
                      </p>
                      {req.referenceImageData ? (
                        <div className="flex items-center gap-3 mt-1">
                          <img
                            src={req.referenceImageData}
                            alt={req.referenceImageName || "Reference"}
                            className="w-14 h-14 object-cover border border-[#E5DEC9]"
                          />
                          <span className="text-[#292725] font-medium">
                            {req.referenceImageName}
                          </span>
                        </div>
                      ) : req.referenceImageName ? (
                        <p className="text-[#292725]">
                          {req.referenceImageName}
                        </p>
                      ) : (
                        <p className="text-[#6E6A64]">
                          No reference image attached
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 3: CUSTOMER ORDERS */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {/* Search & status filter bar */}
            <div className="bg-white border border-[#E5DEC9] p-4 sm:p-5 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                <input
                  type="search"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search by order #, customer name, phone, email, payment method, or TrxID..."
                  className="w-full lg:max-w-md px-4 py-2.5 bg-[#F8F5EF] border border-[#E5DEC9] text-xs text-[#292725] focus:outline-none focus:border-[#7A1F3D]"
                />
                <div className="flex flex-wrap items-center gap-2">
                  {["All", ...ORDER_STATUSES].map((st) => {
                    const count =
                      st === "All"
                        ? orders.length
                        : orders.filter((o) => o.status === st).length;
                    const active = orderStatusFilter === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setOrderStatusFilter(st)}
                        className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.14em] border transition-colors ${
                          active
                            ? "bg-[#7A1F3D] border-[#7A1F3D] text-[#F8F5EF]"
                            : "bg-[#F8F5EF] border-[#E5DEC9] text-[#292725] hover:border-[#7A1F3D]"
                        }`}
                      >
                        {st} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="text-[11px] text-[#6E6A64]">
                Showing {filteredOrders.length} of {orders.length} orders
              </p>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white border border-[#E5DEC9] p-12 text-center">
                <p className="font-serif text-2xl text-[#292725]">
                  No customer orders yet
                </p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-white border border-[#E5DEC9] p-12 text-center">
                <p className="font-serif text-2xl text-[#292725]">
                  No orders match this search or filter
                </p>
                <p className="text-sm text-[#6E6A64] mt-2">
                  Try a different keyword or status.
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-[#E5DEC9] p-6 space-y-5"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E5DEC9]">
                    <div>
                      <span className="font-mono text-xs text-[#7A1F3D] font-medium">
                        Order #{order.orderNumber}
                      </span>
                      <h3 className="font-serif text-2xl text-[#292725]">
                        {order.customerName} &middot;{" "}
                        <span className="text-[#7A1F3D]">
                          {formatPrice(order.total)}
                        </span>
                      </h3>
                      <p className="text-xs text-[#6E6A64]">
                        Phone: {order.phone} &middot; WhatsApp:{" "}
                        {order.whatsapp} &middot; Payment:{" "}
                        <strong>{order.paymentMethod}</strong>
                        {order.paymentTransactionId
                          ? ` (TrxID: ${order.paymentTransactionId})`
                          : ""}
                      </p>
                      <p className="text-[11px] text-[#6E6A64] mt-1">
                        Placed:{" "}
                        {new Date(order.createdAt).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {order.customerEmail ? ` · ${order.customerEmail}` : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <label className="text-xs uppercase tracking-wider text-[#6E6A64]">
                        Status:
                      </label>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          handleUpdateOrderStatus(order.id, e.target.value)
                        }
                        className="px-3.5 py-2 bg-[#F8F5EF] border border-[#7A1F3D] text-xs uppercase tracking-wider text-[#292725]"
                      >
                        {ORDER_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                      <a
                        href={`https://wa.me/${order.whatsapp.replace(
                          /[^0-9]/g,
                          ""
                        )}?text=${encodeURIComponent(
                          `Hello ${order.customerName}! This is Reshma's Needle regarding your Order #${order.orderNumber} (status: ${order.status}, total ${formatPrice(order.total)}).`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7A1F3D] text-[#F8F5EF] text-xs uppercase tracking-wider hover:bg-[#61182F] transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Message Client</span>
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 bg-[#F8F5EF] border border-[#E5DEC9]">
                      <span className="uppercase tracking-wider text-[#6E6A64] block">
                        Delivery Address ({order.deliveryZone})
                      </span>
                      <span className="text-[#292725] font-medium mt-1 block">
                        {order.deliveryAddress}
                      </span>
                      {order.orderNotes && (
                        <span className="text-[#7A1F3D] mt-1 block">
                          Notes: {order.orderNotes}
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 bg-[#F8F5EF] border border-[#E5DEC9] space-y-2">
                      {order.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex flex-wrap items-center justify-between gap-2"
                        >
                          <span>
                            <strong>{item.name}</strong> ({item.purchaseMode} /{" "}
                            {item.selectedColor} / {item.selectedSize}) &times;{" "}
                            {item.quantity}
                          </span>
                          <span className="font-mono">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-[#E5DEC9] flex flex-wrap items-center justify-between gap-2 font-medium text-[#292725]">
                        <span>
                          Subtotal {formatPrice(order.subtotal)} + Delivery{" "}
                          {formatPrice(order.deliveryCharge)}
                        </span>
                        <span className="font-mono text-[#7A1F3D]">
                          Total {formatPrice(order.total)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 4: REGISTERED CUSTOMER ACCOUNTS */}
        {activeTab === "customers" && (
          <div className="space-y-6">
            <div className="bg-white border border-[#E5DEC9] p-4 sm:p-5">
              <h2 className="font-serif text-2xl text-[#292725]">
                Registered Customers
              </h2>
              <p className="text-xs text-[#6E6A64] mt-1">
                Every account created on the storefront, with its delivery
                details and order history summary (matched by email).
              </p>
            </div>

            {customers.length === 0 ? (
              <div className="bg-white border border-[#E5DEC9] p-12 text-center">
                <p className="font-serif text-2xl text-[#292725]">
                  No registered customer accounts yet
                </p>
              </div>
            ) : (
              <div className="bg-white border border-[#E5DEC9] overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#E5DEC9] bg-[#F8F5EF] text-[10px] uppercase tracking-[0.14em] text-[#6E6A64]">
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Phone / WhatsApp</th>
                      <th className="px-4 py-3 font-medium">Address</th>
                      <th className="px-4 py-3 font-medium">Joined</th>
                      <th className="px-4 py-3 font-medium text-center">Orders</th>
                      <th className="px-4 py-3 font-medium text-right">Total Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-[#E5DEC9]/70 align-top last:border-b-0"
                      >
                        <td className="px-4 py-4">
                          <p className="font-medium text-[#292725]">{c.name}</p>
                          <p className="text-xs text-[#6E6A64]">{c.email}</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {c.hasSavedMeasurements && (
                              <span className="border border-[#7CA982] bg-[#DEEAE0] px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-[#4A6B53]">
                                Measurements saved
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-[#292725]">
                          <p>{c.phone}</p>
                          <p className="text-[#6E6A64]">{c.whatsapp}</p>
                        </td>
                        <td className="px-4 py-4 text-xs text-[#6E6A64] max-w-[220px]">
                          {c.address}
                        </td>
                        <td className="px-4 py-4 text-xs text-[#6E6A64]">
                          {new Date(c.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-4 text-center text-xs">
                          <span className="font-medium text-[#292725]">
                            {c.orderCount}
                          </span>
                          {c.lastOrderAt && (
                            <p className="text-[10px] text-[#6E6A64]">
                              last{" "}
                              {new Date(c.lastOrderAt).toLocaleDateString(
                                "en-GB",
                                { day: "2-digit", month: "short" }
                              )}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right text-xs font-medium text-[#7A1F3D]">
                          {formatPrice(c.totalSpent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: WEBSITE CONTENT */}
        {activeTab === "content" && <ContentManager />}

        {/* TAB 6: WHATSAPP & PAYMENT SETTINGS */}
        {activeTab === "settings" && (
          <form
            onSubmit={handleSaveSettings}
            className="bg-white border border-[#E5DEC9] p-6 sm:p-10 space-y-8 max-w-4xl"
          >
            <div className="border-b border-[#E5DEC9] pb-4">
              <h2 className="font-serif text-3xl text-[#292725]">
                WhatsApp, Brand, Contact, Delivery &amp; Payment
              </h2>
              <p className="text-xs text-[#6E6A64] mt-1">
                Changes saved here update the live storefront, custom tailoring
                WhatsApp destination, and checkout instructions immediately.
              </p>
            </div>

            {/* Hero & Brand Content */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={settingsForm.brandName}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      brandName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={settingsForm.instagramUrl}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      instagramUrl: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                  WhatsApp Number (floating button &amp; custom orders) *
                </label>
                <input
                  type="text"
                  value={settingsForm.whatsappNumber}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      whatsappNumber: e.target.value,
                    })
                  }
                  placeholder="8801711987654"
                  className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] font-mono text-sm"
                />
                <p className="mt-1.5 text-[11px] leading-relaxed text-[#6E6A64]">
                  Use the full international format, e.g. 8801711987654. This
                  number powers the fixed WhatsApp button on every page. The
                  pre-filled greeting is edited in Page Content &amp; Images
                  → WhatsApp Button.
                </p>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                  Facebook URL
                </label>
                <input
                  type="url"
                  value={settingsForm.facebookUrl}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      facebookUrl: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={settingsForm.contactEmail}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      contactEmail: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] text-sm"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                  Atelier Studio Address
                </label>
                <input
                  type="text"
                  value={settingsForm.atelierAddress}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      atelierAddress: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] text-sm"
                />
              </div>
            </div>

            {/* Delivery Charges */}
            <div className="pt-6 border-t border-[#E5DEC9] grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                  Delivery Charge — Inside Dhaka (৳)
                </label>
                <input
                  type="number"
                  value={settingsForm.deliveryChargeInside}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      deliveryChargeInside: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                  Delivery Charge — Outside Dhaka (৳)
                </label>
                <input
                  type="number"
                  value={settingsForm.deliveryChargeOutside}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      deliveryChargeOutside: Number(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] font-mono text-sm"
                />
              </div>
            </div>

            {/* bKash & Nagad Payment Configuration */}
            <div className="pt-6 border-t border-[#E5DEC9] grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="block text-xs uppercase tracking-wider text-[#7A1F3D] font-medium">
                  bKash Merchant / Personal Number
                </label>
                <input
                  type="text"
                  value={settingsForm.bkashNumber}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      bkashNumber: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-[#F8F5EF] border border-[#E5DEC9] text-sm"
                />
                <label className="block text-xs uppercase tracking-wider text-[#292725]">
                  bKash Checkout Instructions
                </label>
                <textarea
                  rows={3}
                  value={settingsForm.bkashInstructions}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      bkashInstructions: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-[#F8F5EF] border border-[#E5DEC9] text-xs"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-xs uppercase tracking-wider text-[#7A1F3D] font-medium">
                  Nagad Merchant / Personal Number
                </label>
                <input
                  type="text"
                  value={settingsForm.nagadNumber}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      nagadNumber: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-[#F8F5EF] border border-[#E5DEC9] text-sm"
                />
                <label className="block text-xs uppercase tracking-wider text-[#292725]">
                  Nagad Checkout Instructions
                </label>
                <textarea
                  rows={3}
                  value={settingsForm.nagadInstructions}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      nagadInstructions: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 bg-[#F8F5EF] border border-[#E5DEC9] text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-8 py-4 bg-[#7A1F3D] hover:bg-[#61182F] text-[#F8F5EF] text-xs uppercase tracking-[0.18em] transition-colors cursor-pointer"
            >
              Save Settings Draft
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
