import { db } from "@/db";
import { siteContent, storeSettings } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { DEFAULT_CONTENT, mergeContent, type SiteContent } from "./siteContent";
import { readPublishedJson } from "./contentStore";
import type { StoreSettingsRecord } from "@/context/StoreContext";

/**
 * Site copy for page rendering. The published repo file
 * (content/site-content.json — updated by "Save & Publish") comes first;
 * the legacy database is only consulted when that file has never been
 * published yet (older local clones without the files).
 */
export async function getSiteContent(): Promise<SiteContent> {
  const published = await readPublishedJson<Record<string, Record<string, unknown>>>(
    "content/site-content.json"
  );
  if (published.data) {
    return mergeContent(published.data);
  }

  try {
    await ensureSeeded();
    const rows = await db.select().from(siteContent);
    const stored: Record<string, Record<string, unknown>> = {};
    for (const row of rows) stored[row.key] = row.value ?? {};
    return mergeContent(stored);
  } catch (error) {
    console.error("Failed to load site content:", error);
    return mergeContent({});
  }
}

export async function getStoreSettings(): Promise<StoreSettingsRecord | null> {
  const published = await readPublishedJson<StoreSettingsRecord>(
    "content/settings.json"
  );
  if (published.data && typeof published.data.brandName === "string") {
    return { ...published.data, id: published.data.id ?? 1 };
  }

  try {
    await ensureSeeded();
    const [row] = await db.select().from(storeSettings);
    if (!row) return null;
    return {
      id: row.id,
      brandName: row.brandName,
      heroHeadline: row.heroHeadline,
      heroSubtext: row.heroSubtext,
      whatsappNumber: row.whatsappNumber,
      contactEmail: row.contactEmail,
      atelierAddress: row.atelierAddress,
      deliveryChargeInside: row.deliveryChargeInside,
      deliveryChargeOutside: row.deliveryChargeOutside,
      bkashNumber: row.bkashNumber,
      bkashInstructions: row.bkashInstructions,
      nagadNumber: row.nagadNumber,
      nagadInstructions: row.nagadInstructions,
      instagramUrl: row.instagramUrl,
      facebookUrl: row.facebookUrl,
    };
  } catch (error) {
    console.error("Failed to load store settings:", error);
    return null;
  }
}

export { DEFAULT_CONTENT };
