/**
 * Reading and mutating the published content files.
 *
 * Source-of-truth priority:
 *   1. The JSON snapshot inside the current deployment / local clone
 *      (fast; always exactly what the last build shipped).
 *   2. The file on GitHub (fresh reads for runtime data such as orders).
 *   3. The database (legacy local fallback when GitHub is not configured).
 *
 * File layout in the repository:
 *   content/products.json          - published catalogue
 *   content/site-content.json      - edited page copy per page key
 *   content/settings.json          - store settings record
 *   data/orders.json               - customer orders (runtime)
 *   data/customers.json            - customer accounts (runtime)
 *   data/tailoring-requests.json   - bespoke tailoring requests (runtime)
 *   public/images/uploads/**      - images uploaded in the dashboard
 */

import fs from "node:fs/promises";
import path from "node:path";
import {
  isGithubConfigured,
  readRepoJson,
  readRepoFile,
  commitFiles,
} from "./github";
import type { ProductRecord } from "@/context/StoreContext";

export const CONTENT_FILES = {
  products: "content/products.json",
  siteContent: "content/site-content.json",
  settings: "content/settings.json",
} as const;

export const DATA_FILES = {
  orders: "data/orders.json",
  customers: "data/customers.json",
  tailoring: "data/tailoring-requests.json",
} as const;

/** Read a JSON snapshot from the local deployment folder (build output). */
export async function readSnapshotJson<T>(relPath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), relPath),
      "utf8"
    );
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Provenance tag so callers can tell snapshots (older) from live reads. */
export interface RepoRead<T> {
  data: T | null;
  source: "snapshot" | "github" | "none";
}

/**
 * Published content: snapshot first (it is what the site actually serves),
 * then a short-lived GitHub fetch as fallback, then nothing.
 */
export async function readPublishedJson<T>(
  relPath: string,
  revalidateSeconds = 60
): Promise<RepoRead<T>> {
  const snapshot = await readSnapshotJson<T>(relPath);
  if (snapshot !== null) return { data: snapshot, source: "snapshot" };

  if (isGithubConfigured()) {
    try {
      const data = await readRepoJson<T>(relPath, {
        revalidate: revalidateSeconds,
      });
      if (data !== null) return { data, source: "github" };
    } catch {
      // fall through: a cached snapshot or the caller's default is fine
    }
  }
  return { data: null, source: "none" };
}

/** Runtime data (orders, customers, ...): always read live from GitHub. */
export async function readLiveJson<T>(relPath: string): Promise<RepoRead<T>> {
  if (isGithubConfigured()) {
    try {
      const data = await readRepoJson<T>(relPath);
      if (data !== null) return { data, source: "github" };
    } catch {
      // fall back to the snapshot below
    }
  }
  const snapshot = await readSnapshotJson<T>(relPath);
  return { data: snapshot, source: snapshot !== null ? "snapshot" : "none" };
}

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

interface RawProduct {
  name?: unknown;
  category?: unknown;
  price?: unknown;
  stitchingFee?: unknown;
  description?: unknown;
  fabricDetails?: unknown;
  careInstructions?: unknown;
  images?: unknown;
  colors?: unknown;
  sizes?: unknown;
  inStock?: unknown;
  stockCount?: unknown;
  featured?: unknown;
}

type DraftCategory = "Three Piece" | "Two Piece" | "Tops";

export function cleanCategory(value: unknown): DraftCategory {
  if (value === "Two Piece" || value === "Tops") return value;
  return "Three Piece";
}

export function stringArray(
  value: unknown,
  fallback: string[]
): string[] {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value.map((item) => String(item).trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : fallback;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Normalise a raw admin product into the published record shape. */
export function normalizeProduct(raw: RawProduct): Omit<ProductRecord, "id" | "slug" | "createdAt"> {
  const category = cleanCategory(raw.category);
  const isThreePiece = category === "Three Piece";
  return {
    name: String(raw.name ?? "").trim(),
    category,
    price: Math.max(0, Number(raw.price) || 0),
    stitchingFee: Math.max(
      0,
      Number(raw.stitchingFee) || (isThreePiece ? 1400 : 850)
    ),
    description: String(raw.description ?? ""),
    fabricDetails: String(raw.fabricDetails ?? ""),
    careInstructions: String(raw.careInstructions ?? ""),
    images: stringArray(raw.images, ["/images/collection-three-piece.jpg"]),
    colors: stringArray(raw.colors, ["Warm Ivory", "Deep Wine"]),
    sizes: stringArray(
      raw.sizes,
      isThreePiece
        ? ["Unstitched", "Custom Stitched"]
        : ["XS", "S", "M", "L", "XL", "Custom Tailored"]
    ),
    inStock: raw.inStock !== false,
    stockCount: Math.max(0, Number(raw.stockCount) || 0),
    featured: Boolean(raw.featured),
    supportsUnstitched: isThreePiece,
    supportsCustomTailoring: true,
  };
}

/** Jakarta listing order: featured first, newest first. */
export function sortProducts(list: ProductRecord[]): ProductRecord[] {
  return [...list].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return b.id - a.id;
  });
}

/**
 * Apply an admin catalogue draft to an existing product list.
 * Draft rows use negative ids for new items and deletedIds for removals.
 */
export function applyProductDraft(
  existing: ProductRecord[],
  draft: { items?: unknown[]; deletedIds?: unknown[] } | null
): ProductRecord[] {
  if (!draft) return existing;

  let list = [...existing];

  const deletedIds: number[] = Array.isArray(draft.deletedIds)
    ? draft.deletedIds
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0)
    : [];
  if (deletedIds.length > 0) {
    list = list.filter((p) => !deletedIds.includes(p.id));
  }

  const items = Array.isArray(draft.items) ? draft.items : null;
  if (!items) return list;

  let idCounter = list.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  const existingSlugs = new Set(list.map((p) => p.slug));

  for (const raw of items) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const name = String(item.name ?? "").trim();
    if (!name) continue;

    const fields = normalizeProduct(item as RawProduct);
    const id = Number(item.id);

    if (Number.isInteger(id) && id > 0) {
      const index = list.findIndex((p) => p.id === id);
      if (index >= 0) {
        list[index] = { ...list[index], ...fields };
        continue;
      }
      // Unknown id: treat it as a new product below.
    }

    // New draft row: allocate an id and a unique published slug.
    const baseSlug = slugify(name) || "piece";
    let slug = baseSlug;
    let attempt = 1;
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${attempt}`;
      attempt += 1;
    }
    existingSlugs.add(slug);
    list.push({
      ...fields,
      id: idCounter++,
      slug,
      createdAt: new Date().toISOString(),
    } as unknown as ProductRecord);
  }

  return list;
}

/**
 * Commit a JSON text file to the repo atomically, skipping the commit when
 * the serialized content already matches what is on the branch (so no
 * unnecessary Vercel deployment is triggered).
 */
export async function commitJsonFile(
  relPath: string,
  value: unknown,
  message: string,
  currentExistingSha?: string
): Promise<{ committed: boolean; skipped: boolean; commitSha: string | null }> {
  const text = JSON.stringify(value, null, 2);
  if (currentExistingSha) {
    const current = await readRepoFile(relPath).catch(() => null);
    if (current && current.blobSha === currentExistingSha) {
      return { committed: true, skipped: true, commitSha: null };
    }
  }
  const result = await commitFiles(message, [{ path: relPath, text }]);
  return {
    committed: !result.skipped,
    skipped: result.skipped,
    commitSha: result.commitSha,
  };
}
