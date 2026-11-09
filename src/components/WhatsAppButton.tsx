"use client";

import React from "react";
import { useStore } from "@/context/StoreContext";

/**
 * Floating WhatsApp concierge.
 *
 * The destination number is the one saved in the admin dashboard
 * (WhatsApp, Delivery & Payment tab) and the pre-filled message comes from
 * the admin page content (WhatsApp Button). The button is fixed to the
 * bottom-right corner on every page and uses the atelier maroon.
 */
export function WhatsAppButton() {
  const { settings, content } = useStore();

  const digits = (settings.whatsappNumber || "").replace(/[^0-9]/g, "");
  if (digits.length < 8) return null;

  const message = content.global.whatsappMessage?.trim();
  const href = `https://wa.me/${digits}${
    message ? `?text=${encodeURIComponent(message)}` : ""
  }`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Reshma's Needle on WhatsApp"
      className="group fixed bottom-[calc(1.25rem_+_env(safe-area-inset-bottom))] right-4 z-40 inline-flex items-center gap-3 sm:bottom-[calc(1.5rem_+_env(safe-area-inset-bottom))] sm:right-6"
    >
      <span className="pointer-events-none hidden translate-x-2 border border-[#E5DEC9] bg-[#F8F5EF] px-3.5 py-2 text-[10px] uppercase tracking-[0.16em] text-[#292725] opacity-0 shadow-[0_10px_24px_rgba(41,39,37,0.14)] transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100 sm:block">
        Chat on WhatsApp
      </span>
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#7A1F3D] text-[#F8F5EF] shadow-[0_12px_28px_rgba(122,31,61,0.35)] ring-1 ring-[#E8CE9C]/40 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:bg-[#61182F] group-hover:shadow-[0_16px_34px_rgba(122,31,61,0.45)]">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-7 w-7"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.05-.52-.099-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
      </span>
    </a>
  );
}
