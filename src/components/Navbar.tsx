"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, User, Menu, X, Scissors } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { useStore } from "@/context/StoreContext";

const MAIN_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/customize", label: "Customize" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const { totalItems, setIsCartDrawerOpen, customer, toastMessage } =
    useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sliding pill for the desktop nav (active item + hover travel)
  const navRef = useRef<HTMLElement | null>(null);
  const linkRefs = useRef<Array<HTMLAnchorElement | null>>([]);
  const hoverRef = useRef<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [pill, setPill] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const isActiveLink = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  const activeIndex = MAIN_LINKS.findIndex((link) => isActiveLink(link.href));

  const measurePill = (index: number) => {
    const el = linkRefs.current[index];
    const nav = navRef.current;
    if (!el || !nav || index === -1) return;
    const navRect = nav.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    setPill({
      left: rect.left - navRect.left,
      width: rect.width,
      opacity: 1,
    });
  };

  const handleHover = (index: number) => {
    hoverRef.current = index;
    setHoverIndex(index);
    measurePill(index);
  };

  const handleLeaveNav = () => {
    hoverRef.current = null;
    setHoverIndex(null);
    if (activeIndex !== -1) {
      measurePill(activeIndex);
    } else {
      // No active item on this route (e.g. /checkout, /cart) — fade the
      // pill out instead of leaving it stuck on the last hovered link,
      // where it would render as a dark blob over dark label text.
      setPill((prev) => ({ ...prev, opacity: 0 }));
    }
  };

  // Measure reliably: synchronously before paint, again after webfonts load
  // (font swap changes link widths) and on window resize.
  const useIsoLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

  useIsoLayoutEffect(() => {
    // Reset hover state only when the route changes
    hoverRef.current = null;
    setHoverIndex(null);

    if (activeIndex === -1) {
      setPill({ left: 0, width: 0, opacity: 0 });
      return;
    }
    let cancelled = false;

    const update = () => {
      if (cancelled) return;
      const target = hoverRef.current ?? activeIndex;
      if (target !== -1) measurePill(target);
    };

    update();
    document.fonts?.ready.then(update).catch(() => {});
    window.addEventListener("resize", update);

    return () => {
      cancelled = true;
      window.removeEventListener("resize", update);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Hide the header when scrolling down, reveal it when scrolling up.
  // rAF-throttled so it stays perfectly smooth, with hysteresis so the
  // threshold boundary never flickers.
  const [headerHidden, setHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const rafId = useRef(0);

  useEffect(() => {
    const update = () => {
      const y = window.scrollY;

      // Always show near the top of the page
      if (y < 80) {
        setHeaderHidden(false);
        lastScrollY.current = y;
        ticking.current = false;
        return;
      }

      const delta = y - lastScrollY.current;
      // Hide after scrolling 8px down; risk flipping only after 12px up
      if (delta > 8) setHeaderHidden(true);
      else if (delta < -12) setHeaderHidden(false);
      lastScrollY.current = y;
      ticking.current = false;
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      rafId.current = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  // The admin studio gets a quiet header: no storefront navigation, just a
  // large centred brand mark.
  if (isAdmin) {
    return (
      <>
        <header className="sticky top-0 z-40 w-full border-b border-[#E5DEC9]/80 bg-[#F8F5EF]/90 backdrop-blur-md">
          <div
            aria-hidden="true"
            className="gold-hairline pointer-events-none absolute bottom-0 left-0 h-px w-full opacity-50"
          />
          <div className="mx-auto flex h-[128px] max-w-[1440px] items-center justify-center px-5 sm:px-8 lg:px-14">
            <BrandLogo size="xl" />
          </div>
        </header>

        {toastMessage && (
          <div className="fixed bottom-24 left-4 right-4 z-50 flex max-w-[calc(100vw_-_2rem)] items-center gap-3 border border-[#7A1F3D]/40 bg-[#292725] px-5 py-3.5 text-[#F8F5EF] shadow-xl animate-fade-in sm:left-auto sm:right-6">
            <span className="w-2 h-2 rounded-full bg-[#4A6B53]" />
            <span className="text-xs tracking-[0.06em]">{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full bg-[#F8F5EF]/85 backdrop-blur-md border-b border-[#E5DEC9]/80 will-change-transform transform-gpu motion-reduce:transition-none transition-transform duration-[420ms] ease-[cubic-bezier(0.33,1,0.68,1)] ${
          headerHidden
            ? "-translate-y-full pointer-events-none"
            : "translate-y-0"
        }`}
      >
        <div aria-hidden="true" className="gold-hairline pointer-events-none absolute bottom-0 left-0 h-px w-full opacity-50" />
        <div className="mx-auto flex h-[96px] max-w-[1440px] items-center justify-between px-4 sm:px-8 lg:px-14">
          {/* Left: Mobile Menu Button + Brand Logo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="-ml-1.5 p-1.5 text-[#292725] transition-colors hover:text-[#7A1F3D] sm:-ml-2 sm:p-2 lg:hidden"
            >
              <Menu className="w-5 h-5 stroke-[1.5]" />
            </button>
            <div className="max-[359px]:[&_img]:h-16 translate-y-[6px]">
              <BrandLogo size="md" />
            </div>
          </div>

          {/* Center: Main navigation with a sliding dark pill.
              The pill travels smoothly to the hovered item; the active item
              shows a dot underneath — ivory under the pill, wine when the
              pill has travelled elsewhere. */}
          <nav
            ref={navRef}
            aria-label="Main Navigation"
            onMouseLeave={() => handleLeaveNav()}
            className="relative hidden lg:flex items-center gap-2.5"
          >
            {/* Sliding pill background (no capsule behind the whole menu) */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 h-10 -translate-y-1/2 rounded-full bg-[#292725] shadow-[0_4px_14px_rgba(41,39,37,0.25)] transition-[left,width,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ left: pill.left, width: pill.width, opacity: pill.opacity }}
            />
            {MAIN_LINKS.map((link, index) => {
              const isActive = isActiveLink(link.href);
              // The item is "under the pill" when hovered, or when nothing is
              // hovered (pill rests on the active item). Only then does the
              // label turn ivory — otherwise it stays readable on the light bg.
              const underPill =
                hoverIndex === null
                  ? index === activeIndex
                  : hoverIndex === index;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  ref={(el) => {
                    linkRefs.current[index] = el;
                  }}
                  onMouseEnter={() => handleHover(index)}
                  onFocus={() => handleHover(index)}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative z-10 rounded-full px-5 py-2.5 text-[10px] uppercase tracking-[0.18em] transition-colors duration-300 ${
                    underPill
                      ? "text-[#F8F5EF]"
                      : "text-[#292725]"
                  }`}
                >
                  {link.label}
                  {/* Dot underneath the active item: sage green while the dark pill
                      covers it, wine/maroon once the pill moves away on hover */}
                  <span
                    className={`absolute left-1/2 -translate-x-1/2 bottom-[2px] h-1 w-1 rounded-full transition-[opacity,background-color] duration-300 ${
                      isActive ? "opacity-100" : "opacity-0"
                    } ${underPill ? "bg-[#8FBC98]" : "bg-[#7A1F3D]"}`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Right: Account & Shopping Bag Icons (+ subtle Admin studio link) */}
          <div className="flex items-center gap-2 sm:gap-5">
            <Link
              href="/account"
              aria-label="Customer Account"
              className={`relative flex items-center gap-2 p-1.5 transition-colors sm:p-2 ${
                pathname.startsWith("/account")
                  ? "text-[#7A1F3D]"
                  : "text-[#292725] hover:text-[#7A1F3D]"
              }`}
            >
              <User className="w-5 h-5 stroke-[1.5]" />
              {customer && (
                <span className="hidden xl:inline text-xs tracking-wider text-[#7A1F3D] font-medium">
                  {customer.name.split(" ")[0]}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(true)}
              aria-label="Shopping Bag"
              className="relative flex items-center gap-1.5 p-1.5 text-[#292725] transition-colors hover:text-[#7A1F3D] sm:p-2"
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
              {totalItems > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-medium bg-[#7A1F3D] text-[#F8F5EF] rounded-full">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Subtle Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-4 right-4 z-50 flex max-w-[calc(100vw_-_2rem)] items-center gap-3 border border-[#7A1F3D]/40 bg-[#292725] px-5 py-3.5 text-[#F8F5EF] shadow-xl animate-fade-in sm:left-auto sm:right-6">
          <span className="w-2 h-2 rounded-full bg-[#4A6B53]" />
          <span className="text-xs tracking-[0.06em]">{toastMessage}</span>
        </div>
      )}

      {/* Mobile Navigation Drawer — slides in and out smoothly */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          mobileMenuOpen ? "" : "pointer-events-none"
        }`}
        aria-hidden={!mobileMenuOpen}
      >
        <div
          className={`absolute inset-0 bg-[#292725]/40 backdrop-blur-xs transition-opacity duration-300 ease-out ${
            mobileMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileMenuOpen(false)}
        />
        <div
          inert={!mobileMenuOpen}
          className={`relative z-10 flex h-full w-[85%] max-w-sm flex-col justify-between overflow-y-auto border-r border-[#E5DEC9] bg-[#F8F5EF] p-7 transform-gpu will-change-transform transition-transform duration-[420ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-[#E5DEC9]">
                <BrandLogo size="sm" />
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close navigation menu"
                  className="p-2 text-[#292725] hover:text-[#7A1F3D]"
                >
                  <X className="w-5 h-5 stroke-[1.5]" />
                </button>
              </div>

              <nav className="mt-10 flex flex-col space-y-6">
                {MAIN_LINKS.map((link) => {
                  const isActive =
                    link.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(link.href);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`font-serif text-3xl tracking-[0.02em] transition-colors ${
                        isActive
                          ? "text-[#7A1F3D] italic"
                          : "text-[#292725] hover:text-[#7A1F3D]"
                      }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-10 pt-8 border-t border-[#E5DEC9] flex flex-col space-y-4">
                <Link
                  href="/customize"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center gap-2 w-full bg-wine-rich text-[#F8F5EF] py-3.5 px-5 text-xs uppercase tracking-[0.16em] btn-sheen"
                >
                  <Scissors className="w-4 h-4 stroke-[1.5]" />
                  <span>Get It Custom Made</span>
                </Link>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Link
                    href="/account"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 border border-[#E5DEC9] text-center text-xs uppercase tracking-[0.14em] text-[#292725]"
                  >
                    My Account
                  </Link>
                  <Link
                    href="/cart"
                    onClick={() => setMobileMenuOpen(false)}
                    className="py-2.5 px-3 border border-[#E5DEC9] text-center text-xs uppercase tracking-[0.14em] text-[#292725]"
                  >
                    Bag ({totalItems})
                  </Link>
                </div>

              </div>
            </div>

            <div className="pt-8 text-[11px] text-[#6E6A64] tracking-wider">
              <p>Bespoke Women&rsquo;s Clothing &amp; Tailoring</p>
              <p className="mt-1 text-[#292725]">Reshma&rsquo;s Needle Atelier</p>
            </div>
        </div>
      </div>
    </>
  );
}
