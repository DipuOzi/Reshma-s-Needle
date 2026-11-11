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
          On dark backgrounds the ivory-text variant (public/logo-light.svg)
          is used directly, so the wordmark reads on charcoal with no plate. */}
      {isLight ? (
        <img
          src="/logo-light.svg"
          alt="Reshma's Needle — Atelier & Bespoke Tailoring"
          width={Math.round(px * 1.2)}
          height={px}
          className={imgClasses}
          draggable={false}
        />
      ) : (
        <img
          src="/logo.svg"
          alt="Reshma's Needle — Atelier & Bespoke Tailoring"
          width={Math.round(px * 1.2)}
          height={px}
          className={imgClasses}
          draggable={false}
        />
      )}
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="focus:outline-none">
      {content}
    </Link>
  );
}
