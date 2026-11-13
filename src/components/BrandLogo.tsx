import React from "react";
import Link from "next/link";

interface BrandLogoProps {
  variant?: "dark" | "light";
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  href?: string;
}

export function BrandLogo({
  variant = "dark",
  size = "md",
  href = "/",
}: BrandLogoProps) {
  const isLight = variant === "light";

  // The logo artwork lives in one file: public/logo.png (the brand lockup,
  // aspect ≈ 1.2:1). The navbar slot is fixed — the logo never scales or
  // shifts on hover.
  const imgClasses =
    size === "sm"
      ? "h-12 w-auto"    // 48px tall — mobile drawer
      : size === "lg"
      ? "h-24 w-auto"    // 96px tall — large feature slots
      : size === "xl"
      ? "h-28 w-auto"    // 112px tall — admin header
      : size === "2xl"
      ? "h-32 w-auto"    // 128px tall — footer brand
      : "h-[84px] w-auto translate-y-[4px]"; // 84px tall — desktop navbar (nudged 4px down)

  const px =
    size === "sm" ? 48 : size === "lg" ? 96 : size === "xl" ? 112 : size === "2xl" ? 128 : 84;

  const content = (
    <div className="inline-flex items-center select-none">
      {/* Official logo artwork (public/logo.png) — the full brand lockup.
          On dark backgrounds the ivory-text variant (public/logo-light.png)
          is used, so the wordmark reads on charcoal with no plate. */}
      <img
        src={isLight ? "/logo-light.png" : "/logo.png"}
        alt="Reshma's Needle — Atelier & Bespoke Tailoring"
        width={Math.round(px * 1.2)}
        height={px}
        className={imgClasses}
        draggable={false}
      />
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="focus:outline-none">
      {content}
    </Link>
  );
}
