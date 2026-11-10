"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { OrderItemPayload, MeasurementMap } from "@/db/schema";
import { mergeContent, type SiteContent } from "@/lib/siteContent";

export interface ProductRecord {
  id: number;
  slug: string;
  name: string;
  category: "Three Piece" | "Two Piece" | "Tops";
  price: number;
  stitchingFee: number;
  description: string;
  fabricDetails: string;
  careInstructions: string;
  images: string[];
  colors: string[];
  sizes: string[];
  inStock: boolean;
  stockCount: number;
  featured: boolean;
  supportsUnstitched: boolean;
  supportsCustomTailoring: boolean;
  /** ISO timestamp; present on published/persisted records. */
  createdAt?: string;
}

export interface StoreSettingsRecord {
  id: number;
  brandName: string;
  heroHeadline: string;
  heroSubtext: string;
  whatsappNumber: string;
  contactEmail: string;
  atelierAddress: string;
  deliveryChargeInside: number;
  deliveryChargeOutside: number;
  bkashNumber: string;
  bkashInstructions: string;
  nagadNumber: string;
  nagadInstructions: string;
  instagramUrl: string;
  facebookUrl: string;
}

export interface CustomerSession {
  id: number;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  savedMeasurements?: MeasurementMap;
  measurementUnit?: "inches" | "cm";
}

export interface CartItem extends OrderItemPayload {
  cartItemId: string;
}

interface StoreContextValue {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "cartItemId">) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  subtotal: number;
  totalItems: number;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
  quickViewProduct: ProductRecord | null;
  setQuickViewProduct: (product: ProductRecord | null) => void;
  settings: StoreSettingsRecord;
  refreshSettings: () => Promise<void>;
  customer: CustomerSession | null;
  setCustomer: (customer: CustomerSession | null) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  content: SiteContent;
  setContent: (content: SiteContent) => void;
  refreshContent: () => Promise<void>;
}

const defaultSettings: StoreSettingsRecord = {
  id: 1,
  brandName: "Reshma's Needle",
  heroHeadline: "Elegance, Made Personal.",
  heroSubtext:
    "Thoughtfully designed clothing, tailored to feel uniquely yours.",
  whatsappNumber: "8801711987654",
  contactEmail: "atelier@reshmasneedle.com",
  atelierAddress: "House 14, Road 7, Gulshan-1, Dhaka 1212",
  deliveryChargeInside: 80,
  deliveryChargeOutside: 150,
  bkashNumber: "01711-987654 (Merchant)",
  bkashInstructions:
    "Open your bKash app, choose 'Make Payment' to 01711-987654, enter your order total, and provide the Transaction ID (TrxID) below or share via WhatsApp.",
  nagadNumber: "01819-987654 (Merchant)",
  nagadInstructions:
    "Open your Nagad app, select 'Merchant Pay' to 01819-987654, enter your order total, and provide your Transaction ID below or share via WhatsApp.",
  instagramUrl: "https://instagram.com/reshmasneedle",
  facebookUrl: "https://facebook.com/reshmasneedle",
};

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

export function StoreProvider({
  children,
  initialSettings,
  initialContent,
}: {
  children: React.ReactNode;
  initialSettings?: StoreSettingsRecord | null;
  initialContent?: SiteContent;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] =
    useState<ProductRecord | null>(null);
  const [settings, setSettings] = useState<StoreSettingsRecord>(
    initialSettings ?? defaultSettings
  );
  const [content, setContent] = useState<SiteContent>(
    () => initialContent ?? mergeContent({})
  );
  const [customer, setCustomerState] = useState<CustomerSession | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3600);
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch {
      // keep default settings fallback
    }
  }, []);

  const refreshContent = useCallback(async () => {
    try {
      const res = await fetch("/api/content", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.content) setContent(data.content);
      }
    } catch {
      // keep the currently rendered content
    }
  }, []);

  useEffect(() => {
    try {
      const storedCart = localStorage.getItem("reshmas_needle_cart");
      if (storedCart) {
        setCart(JSON.parse(storedCart));
      }
      const storedCustomer = localStorage.getItem("reshmas_needle_customer");
      if (storedCustomer) {
        setCustomerState(JSON.parse(storedCustomer));
      }
    } catch {
      // ignore storage errors
    }
    setHydrated(true);
    if (!initialSettings) refreshSettings();
  }, [refreshSettings, initialSettings]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("reshmas_needle_cart", JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart, hydrated]);

  const setCustomer = useCallback((c: CustomerSession | null) => {
    setCustomerState(c);
    try {
      if (c) {
        localStorage.setItem("reshmas_needle_customer", JSON.stringify(c));
      } else {
        localStorage.removeItem("reshmas_needle_customer");
      }
    } catch {
      // ignore
    }
  }, []);

  const addToCart = useCallback(
    (item: Omit<CartItem, "cartItemId">) => {
      const cartItemId = `${item.productId}-${item.purchaseMode}-${item.selectedColor}-${item.selectedSize}`;
      setCart((prev) => {
        const existingIndex = prev.findIndex(
          (i) => i.cartItemId === cartItemId
        );
        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            quantity: updated[existingIndex].quantity + item.quantity,
          };
          return updated;
        }
        return [...prev, { ...item, cartItemId }];
      });
      showToast(`Added "${item.name}" to your bag`);
      setIsCartDrawerOpen(true);
    },
    [showToast]
  );

  const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity } : item
      )
    );
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <StoreContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        subtotal,
        totalItems,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
        quickViewProduct,
        setQuickViewProduct,
        settings,
        refreshSettings,
        customer,
        setCustomer,
        toastMessage,
        showToast,
        content,
        setContent,
        refreshContent,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useStore must be used inside StoreProvider");
  }
  return ctx;
}

export function formatPrice(amount: number): string {
  return `৳ ${Number(amount || 0).toLocaleString("en-IN")}`;
}
