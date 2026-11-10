import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { products, siteContent, storeSettings, mediaAssets } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { requireAdmin } from "@/lib/adminAuth";
import {
  DEFAULT_CONTENT,
  isContentPageKey,
  type SiteContent,
} from "@/lib/siteContent";
import {
  applyProductDraft,
  readLiveJson,
} from "@/lib/contentStore";
import {
  githubConfig,
  isGithubConfigured,
  GitHubError,
  readRepoFile,
  readRepoJson,
  commitFiles,
  gitBlobSha,
} from "@/lib/github";
import type { ProductRecord, StoreSettingsRecord } from "@/context/StoreContext";

export const dynamic = "force-dynamic";

const MAX_FIELD_LENGTH = 5000;

const MEDIA_URL_PATTERN = /\/api\/media\/(\d+)/g;
const MEDIA_FILE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/** RAW stored page copy: what the admin actually edited (defaults excluded). */
type StoredPageContent = Record<string, Record<string, string>>;

/* ------------------------------------------------------------------ */
/* GET — publish status / diagnostics                                  */
/* ------------------------------------------------------------------ */

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const config = githubConfig();
  if (!config) {
    return NextResponse.json({
      configured: false,
      mode: "local-database",
      tokensPresent: { GITHUB_TOKEN: false, GITHUB_OWNER: false, GITHUB_REPO: false },
      hint:
        "Set GITHUB_TOKEN, GITHUB_OWNER and GITHUB_REPO in the environment (Vercel: Project Settings → Environment Variables) to publish to GitHub.",
    });
  }

  try {
    const productsFile = await readRepoFile("content/products.json");
    return NextResponse.json({
      configured: true,
      mode: "github",
      owner: config.owner,
      repo: config.repo,
      branch: config.branch,
      repoReachable: true,
      productsFile: productsFile
        ? { blobSha: productsFile.blobSha, bytes: productsFile.base64.length }
        : "missing — it will be created on the next publish",
    });
  } catch (error) {
    return NextResponse.json({
      configured: true,
      mode: "github",
      owner: config.owner,
      repo: config.repo,
      branch: config.branch,
      repoReachable: false,
      error: error instanceof GitHubError ? error.message : String(error),
      hint:
        "Check that the GitHub token has Contents: Read and write permission for this repository.",
    });
  }
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function normalizeDraftContent(raw: unknown): StoredPageContent {
  const clean: StoredPageContent = {};
  if (!raw || typeof raw !== "object") return clean;
  for (const [page, rawValues] of Object.entries(raw as Record<string, unknown>)) {
    if (!isContentPageKey(page) || !rawValues || typeof rawValues !== "object") {
      continue;
    }
    const allowed = Object.keys(DEFAULT_CONTENT[page]);
    const fields: Record<string, string> = {};
    for (const field of allowed) {
      const value = (rawValues as Record<string, unknown>)[field];
      if (typeof value === "string") {
        fields[field] = value.trim().slice(0, MAX_FIELD_LENGTH);
      }
    }
    if (Object.keys(fields).length > 0) clean[page] = fields;
  }
  return clean;
}

function defaultSettingsRecord(): StoreSettingsRecord {
  return {
    id: 1,
    brandName: "Reshma's Needle",
    heroHeadline: "Elegance, Made Personal.",
    heroSubtext: "Thoughtfully designed clothing, tailored to feel uniquely yours.",
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
}

const SETTINGS_KEYS: Array<keyof StoreSettingsRecord> = [
  "brandName",
  "heroHeadline",
  "heroSubtext",
  "whatsappNumber",
  "contactEmail",
  "atelierAddress",
  "deliveryChargeInside",
  "deliveryChargeOutside",
  "bkashNumber",
  "bkashInstructions",
  "nagadNumber",
  "nagadInstructions",
  "instagramUrl",
  "facebookUrl",
];

function mergeSettings(
  current: StoreSettingsRecord,
  draft: unknown
): StoreSettingsRecord {
  const merged: StoreSettingsRecord = { ...current };
  if (draft && typeof draft === "object") {
    const values = draft as Record<string, unknown>;
    for (const key of SETTINGS_KEYS) {
      const value = values[key];
      if (value === undefined) continue;
      if (typeof value === "number" && Number.isFinite(value)) {
        merged[key] = value as never;
      } else if (typeof value === "string") {
        merged[key] = value.slice(0, MAX_FIELD_LENGTH) as never;
      }
    }
  }
  return merged;
}

function collectMediaIds(values: unknown[]): number[] {
  const ids = new Set<number>();
  for (const value of values) {
    const text =
      typeof value === "string" ? value : value == null ? "" : JSON.stringify(value) ?? "";
    for (const match of text.matchAll(MEDIA_URL_PATTERN)) {
      const id = Number(match[1]);
      if (Number.isInteger(id) && id > 0) ids.add(id);
    }
  }
  return [...ids];
}

function rewriteMediaUrls(text: string, urls: Map<number, string>): string {
  let result = text;
  for (const [id, url] of urls.entries()) {
    result = result.split(`/api/media/${id}`).join(url);
  }
  return result;
}

/**
 * Current exact text of a repo file, canonicalized via
 * parse -> stringify so formatting differences never cause commits.
 */
async function canonicalRepoText(relPath: string): Promise<string | null> {
  const parsed = await readRepoJson<unknown>(relPath);
  if (parsed === null) return null;
  return JSON.stringify(parsed, null, 2);
}

function canonicalPage(
  stored: StoredPageContent,
  page: keyof typeof DEFAULT_CONTENT
): Record<string, string> {
  const defaults = DEFAULT_CONTENT[page] as Record<string, string>;
  const saved = stored[page] ?? {};
  const result: Record<string, string> = {};
  for (const field of Object.keys(defaults)) {
    const value = saved[field];
    result[field] =
      typeof value === "string" && value.trim() ? value : defaults[field];
  }
  return result;
}

/** Full merged page copy for the dashboard's instant post-publish refresh. */
function buildCanonicalSiteContent(stored: StoredPageContent): SiteContent {
  const out: Record<string, Record<string, string>> = {};
  for (const page of Object.keys(DEFAULT_CONTENT) as Array<keyof typeof DEFAULT_CONTENT>) {
    out[page] = canonicalPage(stored, page);
  }
  return out as SiteContent;
}

/**
 * Best-effort mirror of the published state into the local database. Only
 * used when GitHub is not configured (local development without a token).
 * Failures are swallowed — the repo JSON files are the live truth.
 */
async function mirrorToDatabase(
  productItems: ProductRecord[],
  storedPageContent: StoredPageContent,
  settings: StoreSettingsRecord
): Promise<void> {
  try {
    await ensureSeeded();
    const liveRows = await db
      .select({ id: products.id, slug: products.slug })
      .from(products);
    const liveIds = new Set(liveRows.map((row) => row.id));
    const liveSlugs = new Set(liveRows.map((row) => row.slug));

    for (const item of productItems) {
      const values = {
        name: item.name,
        category: item.category,
        price: item.price,
        stitchingFee: item.stitchingFee,
        description: item.description,
        fabricDetails: item.fabricDetails,
        careInstructions: item.careInstructions,
        images: item.images,
        colors: item.colors,
        sizes: item.sizes,
        inStock: item.inStock,
        stockCount: item.stockCount,
        featured: item.featured,
        supportsUnstitched: item.supportsUnstitched,
        supportsCustomTailoring: item.supportsCustomTailoring,
      };
      if (liveIds.has(item.id)) {
        await db.update(products).set(values).where(eq(products.id, item.id));
      } else {
        const baseSlug = item.slug || "piece";
        let slug = baseSlug;
        let attempt = 1;
        while (liveSlugs.has(slug)) {
          slug = `${baseSlug}-${attempt}`;
          attempt += 1;
        }
        liveSlugs.add(slug);
        await db.insert(products).values({ ...values, slug });
      }
    }

    for (const [page, fields] of Object.entries(storedPageContent)) {
      if (!isContentPageKey(page)) continue;
      await db
        .insert(siteContent)
        .values({ key: page, value: fields, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: siteContent.key,
          set: { value: fields, updatedAt: new Date() },
        });
    }

    const [existingSettings] = await db.select().from(storeSettings);
    if (existingSettings) {
      await db
        .update(storeSettings)
        .set({
          brandName: settings.brandName,
          heroHeadline: settings.heroHeadline,
          heroSubtext: settings.heroSubtext,
          whatsappNumber: settings.whatsappNumber,
          contactEmail: settings.contactEmail,
          atelierAddress: settings.atelierAddress,
          deliveryChargeInside: settings.deliveryChargeInside,
          deliveryChargeOutside: settings.deliveryChargeOutside,
          bkashNumber: settings.bkashNumber,
          bkashInstructions: settings.bkashInstructions,
          nagadNumber: settings.nagadNumber,
          nagadInstructions: settings.nagadInstructions,
          instagramUrl: settings.instagramUrl,
          facebookUrl: settings.facebookUrl,
          updatedAt: new Date(),
        })
        .where(eq(storeSettings.id, existingSettings.id));
    }
  } catch (error) {
    console.error(
      "[publish] local database mirror skipped (non-fatal):",
      error instanceof Error ? error.message : error
    );
  }
}

/** Has this exact buffer already been committed to the repo? */
async function isFilePresent(repoPath: string, buffer: Buffer): Promise<boolean> {
  try {
    const existing = await readRepoFile(repoPath);
    return existing !== null && existing.blobSha === gitBlobSha(buffer);
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* POST — publish the draft                                            */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid draft payload." },
      { status: 400 }
    );
  }

  const draft = (body ?? {}) as {
    content?: unknown;
    settings?: unknown;
    products?: { items?: unknown[]; deletedIds?: unknown[] } | null;
  };

  if (
    !draft.content &&
    !draft.settings &&
    (!draft.products ||
      (!Array.isArray(draft.products.items) && !Array.isArray(draft.products.deletedIds)))
  ) {
    return NextResponse.json(
      { error: "There are no draft changes to publish." },
      { status: 400 }
    );
  }

  try {
    /* 1. Load the CURRENT state, always straight from the repo tip. ----- */
    /*    (readLiveJson falls back to the deployment snapshot, then null.) */

    const productsRead = await readLiveJson<ProductRecord[]>(
      "content/products.json"
    );
    let currentProducts: ProductRecord[] = Array.isArray(productsRead.data)
      ? (productsRead.data as ProductRecord[])
      : [];

    let storedContent: StoredPageContent =
      (await readLiveJson<StoredPageContent>("content/site-content.json")).data ?? {};

    let currentSettings: StoreSettingsRecord | null = null;
    const settingsParsed = (
      await readLiveJson<Partial<StoreSettingsRecord>>("content/settings.json")
    ).data;
    if (
      settingsParsed &&
      typeof settingsParsed === "object" &&
      typeof settingsParsed.brandName === "string"
    ) {
      currentSettings = {
        ...defaultSettingsRecord(),
        ...settingsParsed,
        id: 1,
      } as StoreSettingsRecord;
    }
    if (!currentSettings) currentSettings = defaultSettingsRecord();

    /* 2. Apply the draft to an in-memory merged state. ------------------ */
    /*    Drafts are never cleared here: if the commit below fails, the    */
    /*    browser keeps its localStorage draft and nothing has changed.    */

    const draftContent = normalizeDraftContent(draft.content);
    for (const [page, fields] of Object.entries(draftContent)) {
      storedContent[page] = { ...(storedContent[page] ?? {}), ...fields };
    }

    const mergedSettings = mergeSettings(currentSettings, draft.settings);
    let mergedProducts = currentProducts;
    if (draft.products) {
      mergedProducts = applyProductDraft(currentProducts, draft.products);
    }

    /* 3. Resolve /api/media/<id> references to committed static files. -- */

    const mediaIds = collectMediaIds([
      ...mergedProducts.flatMap((p) => p.images),
      ...Object.values(storedContent).flatMap((fields) =>
        Object.values(fields)
      ),
    ]);

    const mediaUrlMap = new Map<number, string>();
    const mediaCommits: Array<{ path: string; base64: string }> = [];

    if (mediaIds.length > 0) {
      try {
        await ensureSeeded();
        for (const id of mediaIds) {
          if (mediaUrlMap.has(id)) continue;
          const [asset] = await db
            .select()
            .from(mediaAssets)
            .where(eq(mediaAssets.id, id));
          if (!asset) continue;

          const buffer = Buffer.from(asset.data, "base64");
          const ext = MEDIA_FILE_EXT[asset.mimeType] ?? "jpg";
          const filename = `media-${id}-${gitBlobSha(buffer).slice(0, 8)}.${ext}`;
          const repoPath = `public/images/uploads/${filename}`;
          const url = `/images/uploads/${filename}`;
          mediaUrlMap.set(id, url);
          if (!(await isFilePresent(repoPath, buffer))) {
            mediaCommits.push({
              path: repoPath,
              base64: buffer.toString("base64"),
            });
          }
        }
      } catch (error) {
        console.error(
          "[publish] media resolution skipped (content URLs kept as-is):",
          error instanceof Error ? error.message : error
        );
      }
    }

    if (mediaUrlMap.size > 0) {
      mergedProducts = mergedProducts.map((p) => ({
        ...p,
        images: p.images.map((image) => rewriteMediaUrls(image, mediaUrlMap)),
      }));
      for (const [page, fields] of Object.entries(storedContent)) {
        const nextFields: Record<string, string> = {};
        for (const [field, value] of Object.entries(fields)) {
          nextFields[field] = rewriteMediaUrls(value, mediaUrlMap);
        }
        storedContent[page] = nextFields;
      }
    }

    /* 4. Commit only the changed files to GitHub. ----------------------- */

    const filesToCommit: Array<{ path: string; text: string } | { path: string; base64: string }> =
      mediaCommits.map((file) => ({ ...file }));
    const changedFiles: string[] = mediaCommits.map((file) => file.path);

    const productText = JSON.stringify(mergedProducts, null, 2);
    if ((await canonicalRepoText("content/products.json")) !== productText) {
      filesToCommit.push({ path: "content/products.json", text: productText });
      changedFiles.push("content/products.json");
    }

    const contentText = JSON.stringify(storedContent, null, 2);
    if ((await canonicalRepoText("content/site-content.json")) !== contentText) {
      filesToCommit.push({
        path: "content/site-content.json",
        text: contentText,
      });
      changedFiles.push("content/site-content.json");
    }

    const settingsText = JSON.stringify(mergedSettings, null, 2);
    if ((await canonicalRepoText("content/settings.json")) !== settingsText) {
      filesToCommit.push({ path: "content/settings.json", text: settingsText });
      changedFiles.push("content/settings.json");
    }

    if (!isGithubConfigured()) {
      // Local development without a GitHub token: keep the legacy
      // database-only publish so the workflow still works offline.
      await mirrorToDatabase(mergedProducts, storedContent, mergedSettings);
      return NextResponse.json({
        ok: true,
        mode: "local-database",
        skipped: false,
        commitSha: null,
        changedFiles: changedFiles.length ? changedFiles : undefined,
        published: {
          products: mergedProducts,
          settings: mergedSettings,
        },
        hint:
          "GitHub is not configured — changes went to the local database. Publish again once GITHUB_TOKEN/GITHUB_OWNER/GITHUB_REPO are set to commit them to the repository.",
      });
    }

    let commitSha: string | null = null;
    let skipped = false;
    if (filesToCommit.length > 0) {
      const result = await commitFiles(
        "Publish content from admin dashboard",
        filesToCommit
      );
      commitSha = result.commitSha;
      skipped = result.skipped;
    } else {
      skipped = true;
    }

    /* 5. Return the merged state so the dashboard refreshes instantly. -- */

    return NextResponse.json({
      ok: true,
      mode: "github",
      skipped,
      commitSha,
      changedFiles,
      published: {
        products: mergedProducts,
        settings: mergedSettings,
        content: buildCanonicalSiteContent(storedContent),
      },
    });
  } catch (error) {
    console.error("POST /api/publish error:", error);
    const message =
      error instanceof GitHubError
        ? `GitHub publish failed: ${error.message}`
        : "Publishing failed. Please try again.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
