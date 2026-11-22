"use client";

import { useEffect, useRef } from "react";

/**
 * Animated tailor's needle cursor.
 *
 * The logo's needle (sage shaft, round eye) is drawn with its point exactly on
 * the pointer, and a wine thread runs out of the eye. The thread is a short
 * rope simulated with Verlet integration, so it trails behind the needle and
 * swings/settles on its own when the pointer moves.
 *
 * The needle stays sage everywhere, but the thread cross-fades to champagne
 * gold on dark surfaces (charcoal, wine, photos) so it never disappears into
 * the background. Any element can pin the choice with data-cursor-theme.
 *
 * Only active for fine pointers, and disabled for reduced-motion users — those
 * keep the plain needle cursor defined in globals.css.
 */

const SEGMENTS = 12; // thread points after the eye
const SEGMENT_LENGTH = 5.5; // px between points
const DAMPING = 0.9;
const GRAVITY = 1500; // px/s², keeps the thread hanging naturally
const CONSTRAINT_PASSES = 3;
const EYE_LOCAL = { x: 24.4, y: 24.4 }; // eye position in needle space
const MAX_TILT = 12; // degrees the needle leans into the movement
const DARK_LUMINANCE = 0.3; // below this the surface needs the dark colourway
const OPAQUE_COVERAGE = 0.6; // less solid than this and the page shows through
const THEME_CHECK_MS = 120;

type Point = { x: number; y: number; px: number; py: number };
type Theme = "light" | "dark";

function catmullRomPath(points: Point[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d +=
      ` C ${c1x.toFixed(2)} ${c1y.toFixed(2)}` +
      ` ${c2x.toFixed(2)} ${c2y.toFixed(2)}` +
      ` ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

function channelLuminance(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(r: number, g: number, b: number): number {
  return (
    0.2126 * channelLuminance(r) +
    0.7152 * channelLuminance(g) +
    0.0722 * channelLuminance(b)
  );
}

/** Parses a computed colour, returning null for fully transparent values. */
function parseColor(value: string): [number, number, number, number] | null {
  const match = value.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  const parts = match[1]
    .split(/[,\s/]+/)
    .filter(Boolean)
    .map(Number);
  if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) return null;
  const alpha = parts.length > 3 ? parts[3] : 1;
  if (Number.isNaN(alpha) || alpha < 0.5) return null;
  return [parts[0], parts[1], parts[2], alpha];
}

const imageLuminanceCache = new Map<string, ImageSample | null>();
const imageLuminancePending = new Set<string>();

type ImageSample = { luminance: number; coverage: number };

/**
 * Average luminance of an image, sampled once and cached by source. `coverage`
 * is the share of non-transparent pixels: logos and cut-outs show the page
 * behind them, so their own pixels are not the surface the pointer is over.
 */
function sampleImage(
  element: HTMLImageElement,
  done: (value: number | null, coverage: number) => void
) {
  const src = element.currentSrc || element.src;
  if (!src) return done(null, 0);
  if (imageLuminanceCache.has(src)) {
    const cached = imageLuminanceCache.get(src) ?? null;
    return done(cached?.luminance ?? null, cached?.coverage ?? 0);
  }
  if (imageLuminancePending.has(src)) return;

  imageLuminancePending.add(src);
  const image = new Image();
  if (!src.startsWith("data:")) image.crossOrigin = "anonymous";
  image.onload = () => {
    try {
      const size = 16;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw new Error("no 2d context");
      context.drawImage(image, 0, 0, size, size);
      const { data } = context.getImageData(0, 0, size, size);
      let total = 0;
      let count = 0;
      let pixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        pixels++;
        if (data[i + 3] < 40) continue;
        total += relativeLuminance(data[i], data[i + 1], data[i + 2]);
        count++;
      }
      const result: ImageSample | null =
        count > 0 ? { luminance: total / count, coverage: count / pixels } : null;
      imageLuminanceCache.set(src, result);
      done(result?.luminance ?? null, result?.coverage ?? 0);
    } catch {
      imageLuminanceCache.set(src, null);
      done(null, 0);
    } finally {
      imageLuminancePending.delete(src);
    }
  };
  image.onerror = () => {
    imageLuminanceCache.set(src, null);
    imageLuminancePending.delete(src);
    done(null, 0);
  };
  image.src = src;
}

export function NeedleCursor() {
  const rootRef = useRef<SVGSVGElement>(null);
  const needleRef = useRef<SVGGElement>(null);
  const threadWineRef = useRef<SVGPathElement>(null);
  const threadGoldRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const needle = needleRef.current;
    const threadWine = threadWineRef.current;
    const threadGold = threadGoldRef.current;
    if (!root || !needle || !threadWine || !threadGold) return;

    const gradients = Array.from(root.querySelectorAll("linearGradient"));

    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!finePointer.matches || reducedMotion.matches) return;

    const html = document.documentElement;
    html.classList.add("rn-cursor-active");

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let lastX = mouseX;
    let lastY = mouseY;
    let velocityX = 0;
    let tilt = 0;
    let shown = false;
    let overText = false;
    let raf = 0;
    let lastTime = performance.now();
    let theme: Theme = "light";
    let checkedTarget: Element | null = null;
    let checkedAt = 0;

    const points: Point[] = Array.from({ length: SEGMENTS + 1 }, () => ({
      x: mouseX,
      y: mouseY,
      px: mouseX,
      py: mouseY,
    }));

    const setTheme = (next: Theme) => {
      if (next === theme) return;
      theme = next;
      root.dataset.theme = next;
    };

    const setOpacity = (visible: boolean) => {
      root.style.opacity = visible ? "1" : "0";
    };

    const isTextTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof Element)) return false;
      if (target.closest("button, a, [role='button'], select")) return false;
      const field = target.closest(
        "input, textarea, [contenteditable=''], [contenteditable='true']"
      );
      if (!(field instanceof HTMLElement)) return false;
      if (field instanceof HTMLInputElement) {
        const type = field.type;
        return ![
          "checkbox",
          "radio",
          "file",
          "submit",
          "button",
          "color",
          "range",
        ].includes(type);
      }
      return true;
    };

    /** First explicit cue or opaque background at or above an element. */
    const themeFromSurface = (start: Element | null): Theme | null => {
      let element = start;
      while (element && element !== html) {
        const override = element.getAttribute("data-cursor-theme");
        if (override === "dark" || override === "light") return override;
        if (element instanceof HTMLElement) {
          const color = parseColor(getComputedStyle(element).backgroundColor);
          if (color) {
            const luminance = relativeLuminance(color[0], color[1], color[2]);
            return luminance < DARK_LUMINANCE ? "dark" : "light";
          }
        }
        element = element.parentElement;
      }
      return null;
    };

    /** Resolves the colourway for whatever sits under the pointer. */
    const resolveTheme = (target: EventTarget | null) => {
      let element: Element | null = target instanceof Element ? target : null;
      while (element && element !== html) {
        const override = element.getAttribute("data-cursor-theme");
        if (override === "dark" || override === "light") {
          setTheme(override);
          return;
        }
        if (element instanceof HTMLImageElement) {
          // Photos carry no background colour — measure the pixels instead.
          const source = element;
          sampleImage(element, (value, coverage) => {
            if (checkedTarget !== source) return;
            if (value === null || coverage < OPAQUE_COVERAGE) {
              // Cut-outs and logos: the page behind them is the real surface.
              setTheme(themeFromSurface(source.parentElement) ?? "light");
              return;
            }
            setTheme(value < DARK_LUMINANCE ? "dark" : "light");
          });
          return;
        }
        if (element instanceof HTMLElement) {
          const color = parseColor(getComputedStyle(element).backgroundColor);
          if (color) {
            const luminance = relativeLuminance(color[0], color[1], color[2]);
            setTheme(luminance < DARK_LUMINANCE ? "dark" : "light");
            return;
          }
        }
        element = element.parentElement;
      }
      setTheme("light");
    };

    const onPointerMove = (event: PointerEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      if (!shown) {
        shown = true;
        points.forEach((p) => {
          p.x = mouseX;
          p.y = mouseY;
          p.px = mouseX;
          p.py = mouseY;
        });
      }

      const target = event.target instanceof Element ? event.target : null;
      const now = performance.now();
      if (target !== checkedTarget || now - checkedAt > THEME_CHECK_MS) {
        checkedTarget = target;
        checkedAt = now;
        resolveTheme(event.target);
      }

      const text = isTextTarget(event.target);
      if (text !== overText) {
        overText = text;
        if (!shown || text) setOpacity(false);
        else setOpacity(true);
      } else if (shown && !overText) {
        setOpacity(true);
      }
    };

    const hide = () => {
      shown = false;
      overText = false;
      setOpacity(false);
    };

    const frame = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 1 / 30);
      lastTime = now;

      // Smooth the pointer velocity, then lean the needle into the movement.
      const instantX = dt > 0 ? (mouseX - lastX) / dt : 0;
      velocityX += (instantX - velocityX) * 0.15;
      lastX = mouseX;
      lastY = mouseY;
      tilt +=
        (Math.max(-MAX_TILT, Math.min(MAX_TILT, velocityX * 0.015)) - tilt) * 0.12;

      const rad = (tilt * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      const eyeX = mouseX + EYE_LOCAL.x * cos - EYE_LOCAL.y * sin;
      const eyeY = mouseY + EYE_LOCAL.x * sin + EYE_LOCAL.y * cos;

      // Verlet: the eye is pinned to the needle, the rest of the thread follows.
      const eye = points[0];
      eye.x = eyeX;
      eye.y = eyeY;
      eye.px = eyeX;
      eye.py = eyeY;

      for (let i = 1; i < points.length; i++) {
        const p = points[i];
        const vx = (p.x - p.px) * DAMPING;
        const vy = (p.y - p.py) * DAMPING;
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy + GRAVITY * dt * dt;
      }

      for (let pass = 0; pass < CONSTRAINT_PASSES; pass++) {
        for (let i = 1; i < points.length; i++) {
          const prev = points[i - 1];
          const p = points[i];
          const dx = p.x - prev.x;
          const dy = p.y - prev.y;
          const distance = Math.hypot(dx, dy) || 1;
          const shift = (distance - SEGMENT_LENGTH) / distance;
          // Move the previous position by the same amount, otherwise every
          // constraint correction is read back as velocity and the thread
          // would swing forever instead of settling.
          const correctionX = -dx * shift;
          const correctionY = -dy * shift;
          p.x += correctionX;
          p.y += correctionY;
          p.px += correctionX;
          p.py += correctionY;
        }
      }

      needle.setAttribute(
        "transform",
        `translate(${mouseX.toFixed(2)} ${mouseY.toFixed(2)}) rotate(${tilt.toFixed(2)})`
      );
      const path = catmullRomPath(points);
      threadWine.setAttribute("d", path);
      threadGold.setAttribute("d", path);
      const tail = points[points.length - 1];
      for (const gradient of gradients) {
        gradient.setAttribute("x1", eyeX.toFixed(2));
        gradient.setAttribute("y1", eyeY.toFixed(2));
        gradient.setAttribute("x2", tail.x.toFixed(2));
        gradient.setAttribute("y2", tail.y.toFixed(2));
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", hide);
    window.addEventListener("blur", hide);
    const onVisibilityChange = () => {
      if (document.hidden) hide();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerMove);
      document.removeEventListener("mouseleave", hide);
      window.removeEventListener("blur", hide);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      html.classList.remove("rn-cursor-active");
    };
  }, []);

  return (
    <svg
      ref={rootRef}
      aria-hidden="true"
      data-rn-cursor=""
      data-theme="light"
      className="pointer-events-none fixed inset-0 z-[200] h-full w-full opacity-0 transition-opacity duration-150"
    >
      <defs>
        <linearGradient
          id="rn-thread-wine"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="0"
          y2="0"
        >
          <stop offset="0%" stopColor="#7a1f3d" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#7a1f3d" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#7a1f3d" stopOpacity="0.25" />
        </linearGradient>
        <linearGradient
          id="rn-thread-gold"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="0"
          y2="0"
        >
          <stop offset="0%" stopColor="#e8ce9c" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#e8ce9c" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#e8ce9c" stopOpacity="0.25" />
        </linearGradient>
      </defs>

      {/* Thread trailing from the eye, cross-fading between the two palettes. */}
      <path
        ref={threadWineRef}
        className="rn-thread-wine"
        fill="none"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        ref={threadGoldRef}
        className="rn-thread-gold"
        fill="none"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Needle: a tapered shaft that comes to a real point at the local origin
          (the hotspot) and runs down-right, like a normal mouse pointer, with
          the round eye at its head. */}
      <g ref={needleRef}>
        <path className="rn-needle-edge" d="M0 0 L19.30 21.70 L21.70 19.30 Z" />
        <circle className="rn-needle-edge" cx="20.5" cy="20.5" r="1.7" />
        <path className="rn-needle" d="M0 0 L19.76 21.24 L21.24 19.76 Z" />
        <circle className="rn-needle" cx="20.5" cy="20.5" r="1.05" />
        <circle
          className="rn-eye-edge"
          cx="23.2"
          cy="23.2"
          r="2.9"
          strokeWidth="2.6"
          fill="none"
        />
        <circle
          className="rn-eye"
          cx="23.2"
          cy="23.2"
          r="2.9"
          strokeWidth="1.3"
          fill="none"
        />
      </g>
    </svg>
  );
}
