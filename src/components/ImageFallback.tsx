"use client";

import { useEffect } from "react";

// Neutral ivory tile with the needle monogram, shown in place of any image
// that fails to load (missing file, bad URL, deleted upload).
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400" preserveAspectRatio="xMidYMid slice">` +
      `<rect width="300" height="400" fill="#EFECE4"/>` +
      `<g fill="none" stroke="#7A1F3D" stroke-linecap="round" opacity="0.55">` +
      `<circle cx="150" cy="190" r="34" stroke-width="1.2" opacity="0.5"/>` +
      `<path d="M132 208L166 174" stroke-width="1.6" stroke="#292725"/>` +
      `<path d="M164 176C176 186 158 198 150 192C140 186 134 200 142 208" stroke-width="1.4"/>` +
      `</g>` +
      `<text x="150" y="262" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="#6E6A64" letter-spacing="1">Reshma\u2019s Needle</text>` +
      `</svg>`
  );

export function ImageFallback() {
  useEffect(() => {
    const swap = (img: HTMLImageElement) => {
      if (img.src.startsWith("data:image/svg+xml")) return; // already replaced
      img.removeAttribute("srcset");
      img.src = PLACEHOLDER;
    };

    const onError = (event: Event) => {
      if (event.target instanceof HTMLImageElement) swap(event.target);
    };

    // `error` does not bubble, so listen during the capture phase.
    document.addEventListener("error", onError, true);

    // Catch images that already failed before this component hydrated.
    document.querySelectorAll("img").forEach((img) => {
      if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) {
        swap(img);
      }
    });

    return () => document.removeEventListener("error", onError, true);
  }, []);

  return null;
}
