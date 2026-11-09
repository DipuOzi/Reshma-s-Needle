import React from "react";
import Link from "next/link";

interface BrandLogoProps {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
}

export function BrandLogo({
  variant = "dark",
  size = "md",
  href = "/",
}: BrandLogoProps) {
  const isLight = variant === "light";

  // The full logo lockup lives in one file: public/logo.svg (already cropped
  // to its artwork bounds, aspect ≈ 1.2:1). The navbar slot is fixed — the
  // logo never scales or shifts on hover.
  const imgClasses =
    size === "sm"
      ? "h-12 w-auto"    // 48px tall — mobile drawer
      : size === "lg"
      ? "h-24 w-auto"    // 96px tall — large feature slots
      : size === "xl"
      ? "h-28 w-auto"    // 112px tall — admin header
      : "h-[84px] w-auto"; // 84px tall — desktop navbar

  const px =
    size === "sm" ? 48 : size === "lg" ? 96 : size === "xl" ? 112 : 84;

  const content = (
    <div className="inline-flex items-center select-none">
      {/* Official logo artwork (public/logo.svg) — the full brand lockup.
          On dark backgrounds it sits on a small ivory charm plate with a
          champagne-gold ring so the dark charcoal artwork always reads well. */}
      <span
        className={`flex shrink-0 items-center justify-center ${
          isLight
            ? "rounded-full bg-[#F8F5EF] p-[3px] ring-1 ring-[#C6A15B]/40"
            : ""
        }`}
      >
        <img
          src="/logo.svg"
          alt="Reshma's Needle — Atelier & Bespoke Tailoring"
          width={Math.round(px * 1.2)}
          height={px}
          className={imgClasses}
          draggable={false}
        />
      </span>
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="focus:outline-none">
      {content}
    </Link>
  );
}
