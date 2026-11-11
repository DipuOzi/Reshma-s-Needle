"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, ImagePlus, Loader2, RotateCcw } from "lucide-react";
import { useStore } from "@/context/StoreContext";
import {
  getAdminDraft,
  updateContentDraft,
} from "@/lib/adminDrafts";
import {
  CONTENT_SECTIONS,
  DEFAULT_CONTENT,
  type ContentField,
  type ContentPageKey,
  type SiteContent,
} from "@/lib/siteContent";

type PageValues = Record<string, string>;

export function ContentManager() {
  const { content, showToast } = useStore();
  const [activePage, setActivePage] = useState<ContentPageKey>("home");
  const [drafts, setDrafts] = useState<Record<string, PageValues>>(() =>
    cloneContent(content)
  );
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Restore unpublished edits saved in this browser.
  useEffect(() => {
    const stored = getAdminDraft().content;
    if (!stored || Object.keys(stored).length === 0) return;
    setDrafts((prev) => {
      const next = { ...prev };
      for (const [page, values] of Object.entries(stored)) {
        next[page] = { ...(next[page] ?? {}), ...values };
      }
      return next;
    });
  }, []);

  const section = CONTENT_SECTIONS.find((s) => s.page === activePage)!;
  const draft = drafts[activePage];
  const saved = content[activePage] as PageValues;
  const defaults = DEFAULT_CONTENT[activePage] as PageValues;

  const isDirty = useMemo(
    () => Object.keys(defaults).some((key) => draft[key] !== saved[key]),
    [defaults, draft, saved]
  );

  const updateField = (key: string, value: string) => {
    const nextPage = { ...drafts[activePage], [key]: value };
    setDrafts((prev) => ({ ...prev, [activePage]: nextPage }));
    updateContentDraft(activePage, nextPage);
  };

  const handleUpload = async (field: ContentField, file: File) => {
    setUploadingField(field.key);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/media", { method: "POST", body: formData });
      if (res.status === 401) return window.location.reload();
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Image upload failed.");
        return;
      }
      updateField(field.key, data.url);
      showToast(
        `Image uploaded for "${field.label}". Press Save & Publish to make it live.`
      );
    } catch {
      setError("Image upload failed. Please try again.");
    } finally {
      setUploadingField(null);
    }
  };

  const switchPage = (page: ContentPageKey) => {
    setActivePage(page);
    setError(null);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Page list */}
      <aside className="lg:col-span-3">
        <div className="border border-[#E5DEC9] bg-white p-2 lg:sticky lg:top-[144px]">
          <p className="px-3 pb-2 pt-2 text-[10px] uppercase tracking-[0.2em] text-[#6E6A64]">
            Choose a page
          </p>
          {CONTENT_SECTIONS.map((item) => (
            <button
              key={item.page}
              type="button"
              onClick={() => switchPage(item.page)}
              className={`flex w-full items-center justify-between px-3 py-3 text-left text-sm transition-colors ${
                activePage === item.page
                  ? "bg-[#7A1F3D] text-[#F8F5EF]"
                  : "text-[#292725] hover:bg-[#F8F5EF]"
              }`}
            >
              <span>{item.label}</span>
              <span className="text-[10px] uppercase tracking-wider opacity-70">
                {item.groups.reduce(
                  (count, group) =>
                    count + group.fields.filter((f) => f.type === "image").length,
                  0
                )}{" "}
                img
              </span>
            </button>
          ))}
          <p className="px-3 pb-2 pt-4 text-[11px] leading-relaxed text-[#6E6A64]">
            Product photos, prices and stock are edited in the Products tab.
          </p>
        </div>
      </aside>

      {/* Editor */}
      <div className="space-y-6 lg:col-span-9">
        <div className="flex flex-col justify-between gap-4 border border-[#E5DEC9] bg-white p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-serif text-3xl text-[#292725]">
              {section.label} page
            </h2>
            <p className="mt-1 text-xs text-[#6E6A64]">
              Edits are saved as a draft in this browser and stay hidden from
              the website until you press Save &amp; Publish above. Leave a
              field empty to use the original design text.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={section.path}
              target="_blank"
              className="inline-flex items-center gap-1.5 border border-[#E5DEC9] px-4 py-2.5 text-xs uppercase tracking-[0.14em] text-[#292725] hover:border-[#7A1F3D]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>View live page</span>
            </Link>
            <span className="inline-flex items-center gap-1.5 border border-[#E5DEC9] bg-[#F8F5EF] px-4 py-2.5 text-xs uppercase tracking-[0.14em] text-[#6E6A64]">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isDirty ? "bg-[#C6A15B]" : "bg-[#4A6B53]"
                }`}
              />
              {isDirty ? "Draft saved" : "No draft changes"}
            </span>
          </div>
        </div>

        {error && (
          <div className="border border-[#9E3B3B] bg-[#9E3B3B]/10 p-3 text-sm text-[#9E3B3B]">
            {error}
          </div>
        )}

        {section.groups.map((group) => (
          <fieldset
            key={group.title}
            className="space-y-5 border border-[#E5DEC9] bg-white p-5 sm:p-7"
          >
            <legend className="px-2 font-serif text-xl text-[#292725]">
              {group.title}
            </legend>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {group.fields.map((field) => {
                const value = draft[field.key] ?? "";
                const changed = value !== saved[field.key];
                const isDefault = value === defaults[field.key];
                const wide = field.type === "textarea" || field.type === "image";
                const inputId = `content-${activePage}-${field.key}`;

                return (
                  <div
                    key={field.key}
                    className={`space-y-1.5 ${wide ? "md:col-span-2" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor={inputId}
                        className="text-xs font-medium uppercase tracking-[0.12em] text-[#292725]"
                      >
                        {field.label}
                        {changed && (
                          <span className="ml-2 normal-case tracking-normal text-[#7A1F3D]">
                            • draft
                          </span>
                        )}
                      </label>
                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => updateField(field.key, defaults[field.key])}
                          className="inline-flex items-center gap-1 text-[11px] text-[#6E6A64] hover:text-[#7A1F3D]"
                          title="Restore the original text or image"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Reset
                        </button>
                      )}
                    </div>

                    {field.type === "image" ? (
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="h-36 w-28 shrink-0 overflow-hidden border border-[#E5DEC9] bg-[#EFECE4]">
                          {value ? (
                            <img src={value} alt={field.label} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="flex-1 space-y-2">
                          <label
                            className={`inline-flex items-center gap-2 border border-dashed border-[#7A1F3D]/50 bg-[#F8F5EF] px-4 py-2.5 text-xs uppercase tracking-[0.14em] text-[#292725] hover:border-[#7A1F3D] ${
                              uploadingField === field.key ? "opacity-60" : ""
                            }`}
                          >
                            {uploadingField === field.key ? (
                              <Loader2 className="h-4 w-4 animate-spin text-[#7A1F3D]" />
                            ) : (
                              <ImagePlus className="h-4 w-4 text-[#7A1F3D]" />
                            )}
                            <span>
                              {uploadingField === field.key ? "Uploading..." : "Upload new image"}
                            </span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                              className="hidden"
                              disabled={uploadingField !== null}
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                event.target.value = "";
                                if (file) handleUpload(field, file);
                              }}
                            />
                          </label>
                          <input
                            id={inputId}
                            type="text"
                            value={value}
                            onChange={(event) => updateField(field.key, event.target.value)}
                            placeholder="or paste an image URL"
                            className="w-full border border-[#E5DEC9] bg-[#F8F5EF] px-3 py-2 font-mono text-xs text-[#292725] outline-none focus:border-[#7A1F3D]"
                          />
                          <p className="text-[11px] text-[#6E6A64]">
                            JPG, PNG, WEBP up to 5 MB.{field.hint ? ` ${field.hint}` : ""}
                          </p>
                        </div>
                      </div>
                    ) : field.type === "textarea" ? (
                      <textarea
                        id={inputId}
                        rows={3}
                        value={value}
                        onChange={(event) => updateField(field.key, event.target.value)}
                        className="w-full border border-[#E5DEC9] bg-[#F8F5EF] px-4 py-3 text-sm text-[#292725] outline-none focus:border-[#7A1F3D]"
                      />
                    ) : (
                      <input
                        id={inputId}
                        type="text"
                        value={value}
                        onChange={(event) => updateField(field.key, event.target.value)}
                        className={`w-full border border-[#E5DEC9] bg-[#F8F5EF] px-4 py-3 text-sm text-[#292725] outline-none focus:border-[#7A1F3D] ${
                          field.type === "link" ? "font-mono text-xs" : ""
                        }`}
                      />
                    )}
                    {field.hint && field.type !== "image" && (
                      <p className="text-[11px] text-[#6E6A64]">{field.hint}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>
        ))}

      </div>
    </div>
  );
}

function cloneContent(content: SiteContent): Record<string, PageValues> {
  const result: Record<string, PageValues> = {};
  for (const [page, values] of Object.entries(content)) {
    result[page] = { ...(values as PageValues) };
  }
  return result;
}
