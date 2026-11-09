import { db, execRaw } from "./index";
import {
  products,
  customers,
  orders,
  customTailoringRequests,
  storeSettings,
} from "./schema";
import { count } from "drizzle-orm";

const globalForSeed = globalThis as typeof globalThis & {
  __reshmasNeedleSeed?: Promise<void> | null;
};

export async function ensureSeeded(): Promise<void> {
  if (globalForSeed.__reshmasNeedleSeed) {
    return globalForSeed.__reshmasNeedleSeed;
  }
  globalForSeed.__reshmasNeedleSeed = runSeed().catch((err) => {
    console.error("Seed error:", err);
    globalForSeed.__reshmasNeedleSeed = null;
  });
  return globalForSeed.__reshmasNeedleSeed;
}

async function runSeed(): Promise<void> {
  // Ensure tables exist via idempotent DDL so first boot never fails before drizzle-kit push
  await execRaw(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price INTEGER NOT NULL,
      stitching_fee INTEGER NOT NULL DEFAULT 1200,
      description TEXT NOT NULL,
      fabric_details TEXT NOT NULL,
      care_instructions TEXT NOT NULL,
      images JSONB NOT NULL,
      colors JSONB NOT NULL,
      sizes JSONB NOT NULL,
      in_stock BOOLEAN NOT NULL DEFAULT true,
      stock_count INTEGER NOT NULL DEFAULT 12,
      featured BOOLEAN NOT NULL DEFAULT false,
      supports_unstitched BOOLEAN NOT NULL DEFAULT false,
      supports_custom_tailoring BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      address TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      saved_measurements JSONB,
      measurement_unit TEXT DEFAULT 'inches',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      customer_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_email TEXT,
      phone TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      delivery_address TEXT NOT NULL,
      delivery_zone TEXT NOT NULL DEFAULT 'Inside Dhaka',
      order_notes TEXT,
      payment_method TEXT NOT NULL,
      payment_transaction_id TEXT,
      items JSONB NOT NULL,
      subtotal INTEGER NOT NULL,
      delivery_charge INTEGER NOT NULL,
      total INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Pending',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS custom_tailoring_requests (
      id SERIAL PRIMARY KEY,
      request_number TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      product_id INTEGER,
      product_name TEXT NOT NULL,
      product_image TEXT,
      selected_color TEXT,
      tailoring_option TEXT NOT NULL DEFAULT 'Bespoke Custom Stitched',
      unit TEXT NOT NULL DEFAULT 'inches',
      measurements JSONB NOT NULL,
      reference_image_name TEXT,
      reference_image_data TEXT,
      special_notes TEXT,
      customer_name TEXT NOT NULL,
      whatsapp_number TEXT NOT NULL,
      delivery_address TEXT NOT NULL,
      additional_instructions TEXT,
      status TEXT NOT NULL DEFAULT 'New Request',
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS site_content (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS media_assets (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size_bytes INTEGER NOT NULL,
      data TEXT NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS store_settings (
      id SERIAL PRIMARY KEY,
      brand_name TEXT NOT NULL DEFAULT 'Reshma''s Needle',
      hero_headline TEXT NOT NULL DEFAULT 'Elegance, Made Personal.',
      hero_subtext TEXT NOT NULL DEFAULT 'Thoughtfully designed clothing, tailored to feel uniquely yours.',
      whatsapp_number TEXT NOT NULL DEFAULT '8801711987654',
      contact_email TEXT NOT NULL DEFAULT 'atelier@reshmasneedle.com',
      atelier_address TEXT NOT NULL DEFAULT 'House 14, Road 7, Gulshan-1, Dhaka 1212',
      delivery_charge_inside INTEGER NOT NULL DEFAULT 80,
      delivery_charge_outside INTEGER NOT NULL DEFAULT 150,
      bkash_number TEXT NOT NULL DEFAULT '01711-987654 (Merchant)',
      bkash_instructions TEXT NOT NULL DEFAULT 'Open your bKash app, choose Make Payment to 01711-987654, enter your order total, and provide the Transaction ID (TrxID) below or share via WhatsApp.',
      nagad_number TEXT NOT NULL DEFAULT '01819-987654 (Merchant)',
      nagad_instructions TEXT NOT NULL DEFAULT 'Open your Nagad app, select Merchant Pay to 01819-987654, enter your order total, and provide your Transaction ID below or share via WhatsApp.',
      instagram_url TEXT NOT NULL DEFAULT 'https://instagram.com/reshmasneedle',
      facebook_url TEXT NOT NULL DEFAULT 'https://facebook.com/reshmasneedle',
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  const [{ value: settingsCount }] = await db
    .select({ value: count() })
    .from(storeSettings);

  if (settingsCount === 0) {
    await db.insert(storeSettings).values({
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
    });
  }

  const [{ value: productCount }] = await db
    .select({ value: count() })
    .from(products);

  if (productCount === 0) {
    await db.insert(products).values([
      {
        slug: "mehrun-chanderi-silk-three-piece",
        name: "Mehrun Handloom Chanderi Three Piece",
        category: "Three Piece",
        price: 7850,
        stitchingFee: 1400,
        description:
          "Woven from luminous Mulberry and Chanderi silk in our signature Deep Wine palette, the Mehrun Three Piece features delicate tonal resham needlework along the neckline and sleeve borders, paired with a whisper-light organza dupatta edged in antique zari.",
        fabricDetails:
          "Kameez: Pure Handloom Chanderi Silk (3.0 yds) | Trouser: Dyed Raw Silk (2.5 yds) | Dupatta: Silk Organza with Zari Selvedge (2.75 yds)",
        careInstructions:
          "Dry clean only. Store folded in breathable muslin away from direct sunlight. Steam on reverse at low heat.",
        images: [
          "/images/product-velvet-wine.jpg",
          "/images/hero-editorial.jpg",
          "/images/atelier-craftsmanship.jpg",
        ],
        colors: ["Deep Wine", "Mulberry Rose", "Warm Ivory"],
        sizes: ["Unstitched", "Custom Stitched"],
        inStock: true,
        stockCount: 9,
        featured: true,
        supportsUnstitched: true,
        supportsCustomTailoring: true,
      },
      {
        slug: "niloufer-sage-organza-three-piece",
        name: "Niloufer Soft Sage Silk-Organza Three Piece",
        category: "Three Piece",
        price: 8400,
        stitchingFee: 1450,
        description:
          "A serene celebration of understated luxury. The Niloufer Three Piece pairs soft sage green pure silk-organza with ivory French-knot botanical motifs, completed by a scalloped shadow-work dupatta and breathable cotton-silk lining.",
        fabricDetails:
          "Kameez: Pure Silk-Organza with Mulmul Lining (3.0 yds) | Trouser: Fine Cotton-Silk (2.5 yds) | Dupatta: Hand-Embroidered Organza (2.75 yds)",
        careInstructions:
          "Professional dry clean recommended. Do not wring or bleach. Press gently over a pressing cloth.",
        images: [
          "/images/collection-three-piece.jpg",
          "/images/product-ivory-zari.jpg",
          "/images/atelier-craftsmanship.jpg",
        ],
        colors: ["Soft Sage", "Celadon Mist", "Warm Ivory"],
        sizes: ["Unstitched", "Custom Stitched"],
        inStock: true,
        stockCount: 7,
        featured: true,
        supportsUnstitched: true,
        supportsCustomTailoring: true,
      },
      {
        slug: "zohra-ivory-tissue-zari-three-piece",
        name: "Zohra Ivory Tissue & Antique Zari Three Piece",
        category: "Three Piece",
        price: 9200,
        stitchingFee: 1500,
        description:
          "Crafted for intimate soirées and timeless occasions, the Zohra ensemble glows in warm ivory tissue silk. Subtle antique gold kasab threads trace architectural borders across the hem and cuffs for an heirloom finish.",
        fabricDetails:
          "Kameez: Handwoven Tissue Silk (3.0 yds) | Trouser: Pure Katan Silk (2.5 yds) | Dupatta: Zari Woven Organza (2.75 yds)",
        careInstructions:
          "Dry clean only. Wrap zari borders in acid-free tissue paper to preserve luster.",
        images: [
          "/images/product-ivory-zari.jpg",
          "/images/hero-editorial.jpg",
          "/images/collection-three-piece.jpg",
        ],
        colors: ["Warm Ivory", "Champagne Gold"],
        sizes: ["Unstitched", "Custom Stitched"],
        inStock: true,
        stockCount: 6,
        featured: false,
        supportsUnstitched: true,
        supportsCustomTailoring: true,
      },
      {
        slug: "aria-raw-silk-tailored-two-piece",
        name: "Aria Ivory Raw Silk Tailored Two Piece",
        category: "Two Piece",
        price: 5950,
        stitchingFee: 950,
        description:
          "Architectural yet fluid, the Aria Two Piece comprises a long structured tunic with deep wine contrast piping and relaxed wide-leg trousers. Available in standard boutique sizes or custom tailored to your exact posture and proportions.",
        fabricDetails:
          "Tunic & Trouser: 100% Spun Mulberry Raw Silk with breathable cotton voile inner lining and mother-of-pearl closures.",
        careInstructions:
          "Dry clean or gentle cold hand wash with silk detergent. Hang dry in shade.",
        images: [
          "/images/collection-two-piece.jpg",
          "/images/product-sage-co-ord.jpg",
          "/images/atelier-craftsmanship.jpg",
        ],
        colors: ["Warm Ivory / Wine Piping", "Sandstone", "Charcoal"],
        sizes: ["XS", "S", "M", "L", "XL", "Custom Tailored"],
        inStock: true,
        stockCount: 14,
        featured: true,
        supportsUnstitched: false,
        supportsCustomTailoring: true,
      },
      {
        slug: "safa-sage-linen-silk-two-piece",
        name: "Safa Soft Sage Pintuck Linen-Silk Two Piece",
        category: "Two Piece",
        price: 5400,
        stitchingFee: 900,
        description:
          "Designed for effortless daytime refinement, the Safa Two Piece blends Belgian linen with fine tussar silk. Knife-edge pintucks elongate the silhouette while the straight-cut ankle trousers offer poise and comfort.",
        fabricDetails:
          "65% Belgian Linen, 35% Tussar Silk blend. Pre-washed for softness and drape.",
        careInstructions:
          "Gentle cold wash separately or dry clean. Warm steam iron while slightly damp.",
        images: [
          "/images/product-sage-co-ord.jpg",
          "/images/collection-two-piece.jpg",
        ],
        colors: ["Soft Sage", "Warm Ivory", "Olive Stone"],
        sizes: ["XS", "S", "M", "L", "XL", "Custom Tailored"],
        inStock: true,
        stockCount: 11,
        featured: false,
        supportsUnstitched: false,
        supportsCustomTailoring: true,
      },
      {
        slug: "noor-mulmul-pleated-blouse-top",
        name: "Noor Hand-Pleated Mulmul Silk Tunic Top",
        category: "Tops",
        price: 3650,
        stitchingFee: 650,
        description:
          "Delicate heirloom pin-tucks and hand-carved mother-of-pearl buttons define the Noor Tunic Top. Cut from featherweight cotton-silk mulmul in warm ivory, it transitions effortlessly from workdays to evening gatherings.",
        fabricDetails:
          "80% Fine Combed Mulmul Cotton, 20% Mulberry Silk. Genuine shell buttons.",
        careInstructions:
          "Hand wash cold with mild soap. Lay flat in shade to dry.",
        images: [
          "/images/collection-tops.jpg",
          "/images/product-wine-tunic.jpg",
        ],
        colors: ["Warm Ivory", "Blush Alabaster", "Soft Sage"],
        sizes: ["XS", "S", "M", "L", "XL", "Custom Tailored"],
        inStock: true,
        stockCount: 16,
        featured: true,
        supportsUnstitched: false,
        supportsCustomTailoring: true,
      },
      {
        slug: "soraya-deep-wine-embroidered-kurta-top",
        name: "Soraya Deep Wine Handloom Silk Kurta Top",
        category: "Tops",
        price: 4100,
        stitchingFee: 700,
        description:
          "Richly dyed in our signature Deep Wine hue, the Soraya Kurta Top features fine tonal threadwork along the mandarin collar and gathered bishop cuffs. Tailored for a graceful, skimming drape.",
        fabricDetails:
          "100% Handloom Matka Silk with soft mercerized cotton trim.",
        careInstructions:
          "Dry clean preferred. Cool iron on reverse side.",
        images: [
          "/images/product-wine-tunic.jpg",
          "/images/collection-tops.jpg",
        ],
        colors: ["Deep Wine", "Espresso Charcoal"],
        sizes: ["XS", "S", "M", "L", "XL", "Custom Tailored"],
        inStock: true,
        stockCount: 10,
        featured: false,
        supportsUnstitched: false,
        supportsCustomTailoring: true,
      },
    ]);
  }

  const [{ value: customerCount }] = await db
    .select({ value: count() })
    .from(customers);

  if (customerCount === 0) {
    const [demoCustomer] = await db
      .insert(customers)
      .values({
        name: "Samira Chowdhury",
        email: "samira@example.com",
        phone: "01712345678",
        whatsapp: "8801712345678",
        address: "Apartment 4B, House 22, Road 11, Banani, Dhaka 1213",
        passwordHash: "reshma2026",
        measurementUnit: "inches",
        savedMeasurements: {
          shoulder: "14.5",
          bust: "36",
          waist: "30",
          hip: "39",
          sleeveLength: "21",
          armhole: "16.5",
          upperArm: "12",
          kameezLength: "44",
          trouserLength: "38",
          trouserWaist: "31",
          trouserHip: "40",
          neckStyle: "Sweetheart Front with Keyhole Back",
        },
      })
      .returning();

    await db.insert(orders).values([
      {
        orderNumber: "RN-2026-1041",
        customerId: demoCustomer.id,
        customerName: "Samira Chowdhury",
        customerEmail: "samira@example.com",
        phone: "01712345678",
        whatsapp: "8801712345678",
        deliveryAddress:
          "Apartment 4B, House 22, Road 11, Banani, Dhaka 1213",
        deliveryZone: "Inside Dhaka",
        orderNotes:
          "Please package in a gift box with a handwritten note.",
        paymentMethod: "bKash",
        paymentTransactionId: "BK9482716XM",
        items: [
          {
            productId: 1,
            slug: "mehrun-chanderi-silk-three-piece",
            name: "Mehrun Handloom Chanderi Three Piece",
            category: "Three Piece",
            image: "/images/product-velvet-wine.jpg",
            unitPrice: 9250,
            quantity: 1,
            purchaseMode: "Custom Stitched",
            selectedColor: "Deep Wine",
            selectedSize: "Custom Stitched",
            measurementUnit: "inches",
            customMeasurements: {
              shoulder: "14.5",
              bust: "36",
              waist: "30",
              hip: "39",
              kameezLength: "44",
              trouserLength: "38",
            },
          },
        ],
        subtotal: 9250,
        deliveryCharge: 80,
        total: 9330,
        status: "In Tailoring",
      },
      {
        orderNumber: "RN-2026-1042",
        customerId: demoCustomer.id,
        customerName: "Farhana Rahman",
        customerEmail: "farhana.r@example.com",
        phone: "01819223344",
        whatsapp: "8801819223344",
        deliveryAddress: "House 9, Road 4, Dhanmondi, Dhaka 1205",
        deliveryZone: "Inside Dhaka",
        orderNotes: "Deliver in the afternoon after 2 PM.",
        paymentMethod: "Cash on Delivery",
        items: [
          {
            productId: 4,
            slug: "aria-raw-silk-tailored-two-piece",
            name: "Aria Ivory Raw Silk Tailored Two Piece",
            category: "Two Piece",
            image: "/images/collection-two-piece.jpg",
            unitPrice: 5950,
            quantity: 1,
            purchaseMode: "Ready-to-Wear",
            selectedColor: "Warm Ivory / Wine Piping",
            selectedSize: "M",
          },
        ],
        subtotal: 5950,
        deliveryCharge: 80,
        total: 6030,
        status: "Confirmed",
      },
    ]);

    await db.insert(customTailoringRequests).values([
      {
        requestNumber: "BESP-2026-801",
        category: "Three Piece",
        productId: 1,
        productName: "Mehrun Handloom Chanderi Three Piece",
        productImage: "/images/product-velvet-wine.jpg",
        selectedColor: "Deep Wine",
        tailoringOption: "Custom Stitched Three Piece",
        unit: "inches",
        measurements: {
          shoulder: "14.5",
          bust: "36",
          waist: "30",
          hip: "39",
          sleeveLength: "21",
          armhole: "16.5",
          upperArm: "12",
          kameezLength: "44",
          trouserLength: "38",
          trouserWaist: "31",
          trouserHip: "40",
          neckStyle: "Boat Neckline with 6.5 inch depth & side slits padded",
        },
        specialNotes:
          "Please keep the sleeves unlined for a sheer look, and add concealed side pocket on the right trouser.",
        customerName: "Samira Chowdhury",
        whatsappNumber: "+8801712345678",
        deliveryAddress:
          "Apartment 4B, House 22, Road 11, Banani, Dhaka 1213",
        additionalInstructions: "Need before next Friday evening dinner.",
        status: "On Cutting Table",
      },
      {
        requestNumber: "BESP-2026-802",
        category: "Two Piece",
        productId: 4,
        productName: "Aria Ivory Raw Silk Tailored Two Piece",
        productImage: "/images/collection-two-piece.jpg",
        selectedColor: "Warm Ivory / Wine Piping",
        tailoringOption: "Bespoke Made-to-Measure",
        unit: "cm",
        measurements: {
          shoulder: "37",
          bust: "92",
          waist: "76",
          hip: "98",
          sleeveLength: "54",
          armhole: "42",
          upperArm: "30",
          kameezLength: "110",
          trouserLength: "96",
          trouserWaist: "78",
          trouserHip: "100",
          neckStyle: "Classic Mandarin Collar with V-Placket",
        },
        specialNotes:
          "Slightly relaxed fit around the waist for all-day comfort.",
        customerName: "Nadia Karim",
        whatsappNumber: "+8801911445566",
        deliveryAddress: "Road 27, Block K, Banani, Dhaka 1213",
        additionalInstructions: "Call on WhatsApp before dispatch.",
        status: "Measurements Verified",
      },
    ]);
  }
}
