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
 * Only active for fine pointers, and disabled for reduced-motion users — those
 * keep the plain needle cursor defined in globals.css.
 */

const SEGMENTS = 12; // thread points after the eye
const SEGMENT_LENGTH = 5.5; // px between points
const DAMPING = 0.9;
const GRAVITY = 1500; // px/s², keeps the thread hanging naturally
const CONSTRAINT_PASSES = 3;
const EYE_LOCAL = { x: 24.4, y: -24.4 }; // eye position in needle space
const MAX_TILT = 12; // degrees the needle leans into the movement

type Point = { x: number; y: number; px: number; py: number };

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

export function NeedleCursor() {
  const rootRef = useRef<SVGSVGElement>(null);
  const needleRef = useRef<SVGGElement>(null);
  const threadRef = useRef<SVGPathElement>(null);
  const gradientRef = useRef<SVGLinearGradientElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const needle = needleRef.current;
    const thread = threadRef.current;
    const gradient = gradientRef.current;
    if (!root || !needle || !thread || !gradient) return;

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

    const points: Point[] = Array.from({ length: SEGMENTS + 1 }, () => ({
      x: mouseX,
      y: mouseY,
      px: mouseX,
      py: mouseY,
    }));

    const setOpacity = (visible: boolean) => {
      root.style.opacity = visible ? "1" : "0";
    };

    const isTextTarget = (target: EventTarget | null): boolean => {
      if (!(target instanceof Element)) return false;
      if (target.closest("button, a, [role='button'], select")) return false;
      const field = target.closest("input, textarea, [contenteditable=''], [contenteditable='true']");
      if (!(field instanceof HTMLElement)) return false;
      if (field instanceof HTMLInputElement) {
        const type = field.type;
        return !["checkbox", "radio", "file", "submit", "button", "color", "range"].includes(type);
      }
      return true;
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
      thread.setAttribute("d", catmullRomPath(points));
      const tail = points[points.length - 1];
      gradient.setAttribute("x1", eyeX.toFixed(2));
      gradient.setAttribute("y1", eyeY.toFixed(2));
      gradient.setAttribute("x2", tail.x.toFixed(2));
      gradient.setAttribute("y2", tail.y.toFixed(2));

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", hide);
    window.addEventListener("blur", hide);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) hide();
    });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerMove);
      document.removeEventListener("mouseleave", hide);
      window.removeEventListener("blur", hide);
      html.classList.remove("rn-cursor-active");
    };
  }, []);

  return (
    <svg
      ref={rootRef}
      aria-hidden="true"
      data-rn-cursor=""
      className="pointer-events-none fixed inset-0 z-[200] h-full w-full opacity-0 transition-opacity duration-150"
    >
      <defs>
        <linearGradient
          ref={gradientRef}
          id="rn-needle-thread"
          gradientUnits="userSpaceOnUse"
          x1="0"
          y1="0"
          x2="0"
          y2="0"
        >
          <stop offset="0%" stopColor="#7A1F3D" stopOpacity="0.95" />
          <stop offset="55%" stopColor="#7A1F3D" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#7A1F3D" stopOpacity="0.25" />
        </linearGradient>
      </defs>

      {/* Thread trailing from the eye of the needle. */}
      <path
        ref={threadRef}
        fill="none"
        stroke="url(#rn-needle-thread)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Needle: point at the local origin, eye up and to the right. */}
      <g ref={needleRef}>
        <path d="M0 0 20.5 -20.5" stroke="#5E8A66" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        <path d="M0 0 20.5 -20.5" stroke="#7CA982" strokeWidth="2.1" strokeLinecap="round" fill="none" />
        <circle cx="23.2" cy="-23.2" r="2.9" stroke="#5E8A66" strokeWidth="2.6" fill="none" />
        <circle cx="23.2" cy="-23.2" r="2.9" stroke="#7CA982" strokeWidth="1.3" fill="none" />
      </g>
    </svg>
  );
}
