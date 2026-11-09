import React, { type CSSProperties, type ReactNode } from "react";

/**
 * Hand-drawn style, line-art atelier motifs rendered as inline SVG.
 * Everything strokes with `currentColor`, so colour and opacity are set
 * with plain Tailwind text utilities, e.g. `text-[#7A1F3D]/10`.
 */

export type MotifKind =
  | "needle"
  | "scissors"
  | "button"
  | "spool"
  | "pin"
  | "thimble"
  | "tape";

type MotifProps = {
  kind: MotifKind;
  /** Positioning, size, rotation and colour, e.g. "absolute left-8 top-10 w-24 text-[#7A1F3D]/10 rotate-[18deg]" */
  className?: string;
  style?: CSSProperties;
  /** Gentle background motion for the motif itself. */
  animation?: "none" | "float" | "float-slow" | "sway" | "spin" | "pulse";
};

const ANIMATION_CLASS: Record<string, string> = {
  float: "deco-float",
  "float-slow": "deco-float-slow",
  sway: "deco-sway",
  spin: "deco-spin",
  pulse: "deco-pulse",
};

function NeedleArt() {
  return (
    <svg viewBox="0 0 140 230" fill="none" stroke="currentColor" strokeLinecap="round">
      {/* Needle shaft */}
      <path d="M92 30 L86 200" strokeWidth="3.2" />
      {/* Eye */}
      <ellipse cx="89" cy="42" rx="3.4" ry="6.8" strokeWidth="1.6" />
      {/* Thread through the eye, curling across the canvas */}
      <path
        d="M89 44 C 36 76, 118 100, 54 134 C 8 158, 100 174, 50 208"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Loose thread bow, drawn faintly */}
      <path
        d="M50 208 C 34 216, 26 206, 40 200"
        strokeWidth="1.6"
        opacity="0.65"
      />
    </svg>
  );
}

function ScissorsArt() {
  return (
    <svg viewBox="0 0 96 96" fill="none" stroke="currentColor" strokeLinecap="round">
      {/* Blades */}
      <path d="M26 14 L70 82" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M70 14 L26 82" strokeWidth="2.4" strokeLinejoin="round" />
      {/* Handles */}
      <circle cx="21" cy="89" r="7.5" strokeWidth="2.4" />
      <circle cx="75" cy="89" r="7.5" strokeWidth="2.4" />
      {/* Pivot */}
      <circle cx="48" cy="48" r="2.6" strokeWidth="0" fill="currentColor" />
    </svg>
  );
}

function ButtonArt() {
  return (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeLinecap="round">
      <circle cx="24" cy="24" r="19" strokeWidth="2" />
      <circle cx="24" cy="24" r="13.5" strokeWidth="0.9" opacity="0.45" />
      {/* Four holes */}
      <circle cx="18.5" cy="18.5" r="2.7" strokeWidth="1.5" />
      <circle cx="29.5" cy="18.5" r="2.7" strokeWidth="1.5" />
      <circle cx="18.5" cy="29.5" r="2.7" strokeWidth="1.5" />
      <circle cx="29.5" cy="29.5" r="2.7" strokeWidth="1.5" />
      {/* Thread cross-stitch, dashed */}
      <path
        d="M18.5 18.5 L29.5 29.5 M29.5 18.5 L18.5 29.5"
        strokeWidth="1.3"
        strokeDasharray="2.5 2.5"
        opacity="0.7"
      />
    </svg>
  );
}

function SpoolArt() {
  return (
    <svg viewBox="0 0 88 92" fill="none" stroke="currentColor" strokeLinecap="round">
      {/* Flanges */}
      <rect x="24" y="14" width="40" height="7" rx="3" strokeWidth="2" />
      <rect x="24" y="71" width="40" height="7" rx="3" strokeWidth="2" />
      {/* Spool body */}
      <rect x="30" y="21" width="28" height="50" strokeWidth="2" />
      {/* Thread wraps */}
      <path d="M30 28 Q44 26 58 28" strokeWidth="1.6" opacity="0.75" />
      <path d="M30 35 Q44 37 58 35" strokeWidth="1.6" opacity="0.55" />
      <path d="M30 42 Q44 40 58 42" strokeWidth="1.6" opacity="0.75" />
      <path d="M30 49 Q44 51 58 49" strokeWidth="1.6" opacity="0.55" />
      <path d="M30 56 Q44 54 58 56" strokeWidth="1.6" opacity="0.75" />
      <path d="M30 63 Q44 65 58 63" strokeWidth="1.6" opacity="0.55" />
      {/* Thread tail escaping the spool */}
      <path d="M58 30 C 70 34, 66 48, 78 54" strokeWidth="1.6" />
    </svg>
  );
}

function PinArt() {
  return (
    <svg viewBox="0 0 48 40" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M10 33 L36 11" strokeWidth="1.8" />
      <circle cx="39" cy="8.5" r="4.4" strokeWidth="1.8" />
    </svg>
  );
}

function ThimbleArt() {
  return (
    <svg viewBox="0 0 52 68" fill="none" stroke="currentColor" strokeLinecap="round">
      <path d="M10 62 V30 C10 10 42 10 42 30 V62" strokeWidth="2.2" />
      <path d="M6 62 H46" strokeWidth="3" />
      {/* Dimple grid */}
      <g strokeWidth="0" fill="currentColor" opacity="0.75">
        <circle cx="17" cy="22" r="0.9" />
        <circle cx="26" cy="20" r="0.9" />
        <circle cx="35" cy="22" r="0.9" />
        <circle cx="17" cy="30" r="0.9" />
        <circle cx="26" cy="28" r="0.9" />
        <circle cx="35" cy="30" r="0.9" />
        <circle cx="17" cy="38" r="0.9" />
        <circle cx="26" cy="36" r="0.9" />
        <circle cx="35" cy="38" r="0.9" />
        <circle cx="17" cy="46" r="0.9" />
        <circle cx="26" cy="44" r="0.9" />
        <circle cx="35" cy="46" r="0.9" />
        <circle cx="17" cy="54" r="0.9" />
        <circle cx="26" cy="52" r="0.9" />
        <circle cx="35" cy="54" r="0.9" />
      </g>
    </svg>
  );
}

function TapeArt() {
  return (
    <svg viewBox="0 0 180 44" fill="none" stroke="currentColor" strokeLinecap="round">
      {/* Upper edge */}
      <path d="M6 28 C 34 4, 66 36, 96 16 C 118 4, 140 22, 174 10" strokeWidth="1.8" />
      {/* Lower edge */}
      <path
        d="M6 42 C 34 18, 66 50, 96 30 C 118 18, 140 36, 174 24"
        strokeWidth="1.8"
      />
      {/* Measurement ticks along the spine */}
      <path
        d="M6 35 C 34 11, 66 43, 96 23 C 118 11, 140 29, 174 17"
        strokeWidth="1.4"
        strokeDasharray="2 8"
        opacity="0.8"
      />
      {/* End caps */}
      <path d="M6 28 V42" strokeWidth="1.8" />
      <path d="M174 10 V24" strokeWidth="1.8" />
    </svg>
  );
}

const ART: Record<MotifKind, () => ReactNode> = {
  needle: NeedleArt,
  scissors: ScissorsArt,
  button: ButtonArt,
  spool: SpoolArt,
  pin: PinArt,
  thimble: ThimbleArt,
  tape: TapeArt,
};

export function Motif({ kind, className = "", style, animation = "none" }: MotifProps) {
  const Art = ART[kind];
  const animClass = animation !== "none" ? ANIMATION_CLASS[animation] ?? "" : "";

  return (
    <span aria-hidden="true" className={`pointer-events-none select-none ${className}`} style={style}>
      <span
        className={`block h-full w-full [&_svg]:block [&_svg]:h-full [&_svg]:w-full ${animClass}`}
      >
        <Art />
      </span>
    </span>
  );
}

type BackdropItem = {
  kind: MotifKind;
  className?: string;
  style?: CSSProperties;
  animation?: MotifProps["animation"];
};

/**
 * A scattered field of subtle atelier motifs for section backgrounds.
 * Place inside a `relative` section; items are positioned absolutely.
 *
 * Example:
 * ```tsx
 * <AtelierBackdrop
 *   items={[
 *     { kind: "needle", className: "absolute right-10 top-0 w-40 text-[#7A1F3D]/10", animation: "float" },
 *     { kind: "button", className: "absolute left-12 bottom-10 w-14 text-[#A8B5A0]/30" },
 *   ]}
 * />
 * ```
 */
export function AtelierBackdrop({
  items,
  className = "",
}: {
  items: BackdropItem[];
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {items.map((item, index) => (
        <Motif key={index} kind={item.kind} className={item.className} style={item.style} animation={item.animation} />
      ))}
    </div>
  );
}

/**
 * A horizontal "seam" — dashed stitching with an atelier charm at the middle.
 * Reads like the inside seam of a tailored garment.
 */
export function StitchRule({
  charm = "button",
  className = "",
}: {
  charm?: MotifKind | "none";
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={`flex items-center gap-4 ${className}`}>
      <span className="flex-1 border-t-[1.5px] border-dashed border-current opacity-45" />
      {charm !== "none" && (
        <Motif
          kind={charm}
          className="w-7 shrink-0 h-7 [&>span]:h-7 [&>span]:w-7 [&_svg]:h-7 [&_svg]:w-7"
          animation="none"
        />
      )}
      <span className="flex-1 border-t-[1.5px] border-dashed border-current opacity-45" />
    </div>
  );
}
