"use client";

import type {
  ProductRecord,
  StoreSettingsRecord,
} from "@/context/StoreContext";

/**
 * Unpublished admin edits live in the owner's browser until they press
 * "Save & Publish". Nothing here touches the database, so the public
 * storefront keeps showing the last published version.
 */
export interface ProductDraft {
  items: ProductRecord[];
  /** Live product ids the owner removed; new draft rows use negative ids. */
  deletedIds: number[];
}

export interface AdminDraft {
  content?: Record<string, Record<string, string>>;
  settings?: StoreSettingsRecord;
  products?: ProductDraft;
}

export interface DraftSummary {
  contentPages: number;
  settings: boolean;
  products: boolean;
}

const STORAGE_KEY = "reshmas_needle_admin_draft";
export const ADMIN_DRAFT_EVENT = "reshmas-needle-draft-change";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function getAdminDraft(): AdminDraft {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as AdminDraft) : {};
  } catch {
    return {};
  }
}

function writeAdminDraft(draft: AdminDraft): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(ADMIN_DRAFT_EVENT));
}

export function updateContentDraft(
  page: string,
  values: Record<string, string>
): void {
  const draft = getAdminDraft();
  draft.content = { ...(draft.content ?? {}), [page]: values };
  writeAdminDraft(draft);
}

export function updateSettingsDraft(values: StoreSettingsRecord): void {
  const draft = getAdminDraft();
  draft.settings = values;
  writeAdminDraft(draft);
}

export function updateProductsDraft(
  items: ProductRecord[],
  deletedIds: number[]
): void {
  const draft = getAdminDraft();
  draft.products = { items, deletedIds };
  writeAdminDraft(draft);
}

export function clearAdminDraft(): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
  window.dispatchEvent(new Event(ADMIN_DRAFT_EVENT));
}

export function getDraftSummary(): DraftSummary {
  const draft = getAdminDraft();
  return {
    contentPages: Object.keys(draft.content ?? {}).length,
    settings: Boolean(draft.settings),
    products: Boolean(draft.products),
  };
}

export function draftSummaryCount(summary: DraftSummary): number {
  return (
    summary.contentPages +
    (summary.settings ? 1 : 0) +
    (summary.products ? 1 : 0)
  );
}
