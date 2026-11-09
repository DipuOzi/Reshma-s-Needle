import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export interface OrderItemPayload {
  productId: number;
  slug: string;
  name: string;
  category: "Three Piece" | "Two Piece" | "Tops";
  image: string;
  unitPrice: number;
  quantity: number;
  purchaseMode: "Unstitched" | "Custom Stitched" | "Ready-to-Wear";
  selectedColor: string;
  selectedSize: string;
  customMeasurements?: Record<string, string>;
  measurementUnit?: "inches" | "cm";
}

export interface MeasurementMap {
  shoulder?: string;
  bust?: string;
  waist?: string;
  hip?: string;
  sleeveLength?: string;
  armhole?: string;
  upperArm?: string;
  kameezLength?: string;
  trouserLength?: string;
  trouserWaist?: string;
  trouserHip?: string;
  neckStyle?: string;
}

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(), // 'Three Piece' | 'Two Piece' | 'Tops'
  price: integer("price").notNull(),
  stitchingFee: integer("stitching_fee").notNull().default(1200),
  description: text("description").notNull(),
  fabricDetails: text("fabric_details").notNull(),
  careInstructions: text("care_instructions").notNull(),
  images: jsonb("images").$type<string[]>().notNull(),
  colors: jsonb("colors").$type<string[]>().notNull(),
  sizes: jsonb("sizes").$type<string[]>().notNull(),
  inStock: boolean("in_stock").notNull().default(true),
  stockCount: integer("stock_count").notNull().default(12),
  featured: boolean("featured").notNull().default(false),
  supportsUnstitched: boolean("supports_unstitched").notNull().default(false),
  supportsCustomTailoring: boolean("supports_custom_tailoring")
    .notNull()
    .default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp").notNull(),
  address: text("address").notNull(),
  passwordHash: text("password_hash").notNull(),
  savedMeasurements: jsonb("saved_measurements").$type<MeasurementMap>(),
  measurementUnit: text("measurement_unit").default("inches"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: integer("customer_id"),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryZone: text("delivery_zone").notNull().default("Inside Dhaka"),
  orderNotes: text("order_notes"),
  paymentMethod: text("payment_method").notNull(), // 'Cash on Delivery' | 'bKash' | 'Nagad'
  paymentTransactionId: text("payment_transaction_id"),
  items: jsonb("items").$type<OrderItemPayload[]>().notNull(),
  subtotal: integer("subtotal").notNull(),
  deliveryCharge: integer("delivery_charge").notNull(),
  total: integer("total").notNull(),
  status: text("status").notNull().default("Pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customTailoringRequests = pgTable("custom_tailoring_requests", {
  id: serial("id").primaryKey(),
  requestNumber: text("request_number").notNull().unique(),
  category: text("category").notNull(), // 'Three Piece' | 'Two Piece' | 'Tops'
  productId: integer("product_id"),
  productName: text("product_name").notNull(),
  productImage: text("product_image"),
  selectedColor: text("selected_color"),
  tailoringOption: text("tailoring_option")
    .notNull()
    .default("Bespoke Custom Stitched"),
  unit: text("unit").notNull().default("inches"), // 'inches' | 'cm'
  measurements: jsonb("measurements").$type<MeasurementMap>().notNull(),
  referenceImageName: text("reference_image_name"),
  referenceImageData: text("reference_image_data"),
  specialNotes: text("special_notes"),
  customerName: text("customer_name").notNull(),
  whatsappNumber: text("whatsapp_number").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  additionalInstructions: text("additional_instructions"),
  status: text("status").notNull().default("New Request"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const storeSettings = pgTable("store_settings", {
  id: serial("id").primaryKey(),
  brandName: text("brand_name").notNull().default("Reshma's Needle"),
  heroHeadline: text("hero_headline")
    .notNull()
    .default("Elegance, Made Personal."),
  heroSubtext: text("hero_subtext")
    .notNull()
    .default("Thoughtfully designed clothing, tailored to feel uniquely yours."),
  whatsappNumber: text("whatsapp_number").notNull().default("8801711987654"),
  contactEmail: text("contact_email")
    .notNull()
    .default("atelier@reshmasneedle.com"),
  atelierAddress: text("atelier_address")
    .notNull()
    .default("House 14, Road 7, Gulshan-1, Dhaka 1212"),
  deliveryChargeInside: integer("delivery_charge_inside").notNull().default(80),
  deliveryChargeOutside: integer("delivery_charge_outside")
    .notNull()
    .default(150),
  bkashNumber: text("bkash_number").notNull().default("01711-987654 (Merchant)"),
  bkashInstructions: text("bkash_instructions")
    .notNull()
    .default(
      "Open your bKash app, choose 'Make Payment' to 01711-987654, enter your order total, and provide the Transaction ID (TrxID) below or share via WhatsApp."
    ),
  nagadNumber: text("nagad_number").notNull().default("01819-987654 (Merchant)"),
  nagadInstructions: text("nagad_instructions")
    .notNull()
    .default(
      "Open your Nagad app, select 'Merchant Pay' to 01819-987654, enter your order total, and provide your Transaction ID below or share via WhatsApp."
    ),
  instagramUrl: text("instagram_url")
    .notNull()
    .default("https://instagram.com/reshmasneedle"),
  facebookUrl: text("facebook_url")
    .notNull()
    .default("https://facebook.com/reshmasneedle"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Editable page copy & imagery, one row per page (home, shop, about, ...).
export const siteContent = pgTable("site_content", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Record<string, string>>().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Images uploaded from the admin dashboard. Stored in PostgreSQL so they
// survive rebuilds and are served through /api/media/[id].
export const mediaAssets = pgTable("media_assets", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  data: text("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
