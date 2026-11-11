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
      : "h-[84px] w-auto"; // 84px tall — desktop navbar

  const px =
    size === "sm" ? 48 : size === "lg" ? 96 : size === "xl" ? 112 : 84;

  const content = (
    <div className="inline-flex items-center select-none">
      {/* Official logo artwork (public/logo.png) — the full brand lockup,
          used on both light and dark backgrounds. */}
      <img
        src="/logo.png"
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
