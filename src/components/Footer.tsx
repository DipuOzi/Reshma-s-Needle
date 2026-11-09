"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { AtelierBackdrop, Motif, StitchRule } from "./AtelierDecor";
import { useStore } from "@/context/StoreContext";
import {
  MessageCircle,
  MapPin,
  Mail,
  Clock,
  X,
  ArrowUp,
  ArrowRight,
  Scissors,
} from "lucide-react";

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h4 className="flex items-center gap-2.5 text-[11px] uppercase tracking-[0.24em] text-[#7A1F3D]">
          <span aria-hidden="true" className="h-px w-5 bg-[#7A1F3D]/60" />
          {title}
        </h4>
      </div>
      {children}
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group/link inline-flex items-center gap-2 text-sm text-[#4A4641] transition-colors hover:text-[#7A1F3D]"
      >
        <span
          aria-hidden="true"
          className="h-1 w-1 rounded-full bg-[#A8B5A0] transition-all duration-300 group-hover/link:bg-[#7A1F3D] group-hover/link:shadow-[0_0_6px_rgba(122,31,61,0.5)]"
        />
        <span className="border-b border-transparent transition-colors group-hover/link:border-[#7A1F3D]/40">
          {children}
        </span>
      </Link>
    </li>
  );
}

export function Footer() {
  const { settings, content } = useStore();
  const [legalModal, setLegalModal] = useState<"privacy" | "terms" | null>(
    null
  );

  const cleanWhatsapp = settings.whatsappNumber.replace(/[^0-9]/g, "");

  return (
    <>
      <footer className="relative overflow-hidden bg-ivory-rich text-[#292725]">
        {/* Champagne-gold welcome line */}
        <div aria-hidden="true" className="gold-hairline absolute top-0 left-0 h-px w-full" />

        {/* Quiet atelier dressing in the corners */}
        <AtelierBackdrop
          items={[
            {
              kind: "needle",
              className: "absolute -right-8 -top-4 hidden w-48 rotate-[38deg] text-[#7A1F3D]/[0.08] xl:block",
              animation: "float-slow",
            },
            {
              kind: "spool",
              className: "absolute -left-6 bottom-24 hidden w-24 rotate-6 text-[#A8B5A0]/40 xl:block",
              animation: "float",
            },
            {
              kind: "button",
              className: "absolute right-[16%] bottom-10 hidden w-14 text-[#7A1F3D]/[0.08] xl:block",
              animation: "spin",
            },
          ]}
        />

        <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14 py-10 lg:py-12">
          {/* ——— Top: brand + bespoke enquiry card ——— */}
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
            {/* Brand — identical presentation to the header */}
            <div className="space-y-6 lg:col-span-5">
              <BrandLogo size="lg" href="/" />
              <p className="max-w-sm text-sm font-light leading-relaxed text-[#6E6A64]">
                {content.footer.about}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/soc inline-flex items-center gap-2 rounded-full border border-[#292725]/15 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-[#4A4641] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#7A1F3D]/60 hover:text-[#7A1F3D]"
                >
                  <span
                    aria-hidden="true"
                    className="h-1 w-1 rounded-full bg-[#A8B5A0] transition-colors group-hover/soc:bg-[#7A1F3D]"
                  />
                  Instagram
                </a>
                <a
                  href={settings.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/soc inline-flex items-center gap-2 rounded-full border border-[#292725]/15 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-[#4A4641] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#7A1F3D]/60 hover:text-[#7A1F3D]"
                >
                  <span
                    aria-hidden="true"
                    className="h-1 w-1 rounded-full bg-[#A8B5A0] transition-colors group-hover/soc:bg-[#7A1F3D]"
                  />
                  Facebook
                </a>
                <a
                  href={`https://wa.me/${cleanWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/soc inline-flex items-center gap-2 rounded-full border border-[#292725]/15 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-[#4A4641] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#7A1F3D]/60 hover:text-[#7A1F3D]"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </a>
                <Link
                  href="/contact"
                  className="group/soc inline-flex items-center gap-2 rounded-full border border-[#292725]/15 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-[#4A4641] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#7A1F3D]/60 hover:text-[#7A1F3D]"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </Link>
              </div>
            </div>

            {/* Bespoke enquiry card — rich wine plate for contrast on ivory */}
            <div className="lg:col-span-7">
              <div className="relative h-full overflow-hidden bg-wine-rich p-7 text-[#F8F5EF] shadow-[0_24px_50px_rgba(122,31,61,0.2)] sm:p-9">
                <div aria-hidden="true" className="gold-hairline absolute top-0 left-0 h-px w-full opacity-70" />
                <Motif
                  kind="needle"
                  className="absolute -right-4 -top-6 w-28 -rotate-[24deg] text-[#E8CE9C]/[0.18]"
                  animation="sway"
                />
                <div className="relative space-y-4">
                  <p className="inline-flex items-center gap-2.5 text-[11px] uppercase tracking-[0.24em] text-[#E8CE9C]">
                    <Scissors className="h-3.5 w-3.5" />
                    <span>Bespoke Enquiries</span>
                  </p>
                  <h3 className="max-w-md font-serif text-2xl leading-snug sm:text-3xl">
                    Have a design in mind? Send us your measurements.
                  </h3>
                  <p className="max-w-md text-sm leading-relaxed text-[#F8F5EF]/75">
                    Share your style, colours and measurements on WhatsApp —
                    our atelier will guide you through fabric, fit and finishing.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 pt-1.5">
                    <a
                      href={`https://wa.me/${cleanWhatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-sheen inline-flex items-center gap-2.5 bg-[#F8F5EF] px-6 py-3 text-xs uppercase tracking-[0.18em] text-[#7A1F3D] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#A8B5A0] hover:text-[#292725]"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>WhatsApp the Atelier</span>
                    </a>
                    <Link
                      href="/customize"
                      className="group/cta inline-flex items-center gap-2 border-b border-[#F8F5EF]/30 pb-1 text-xs uppercase tracking-[0.18em] text-[#F8F5EF]/85 transition-colors hover:border-[#E8CE9C]/70 hover:text-[#E8CE9C]"
                    >
                      <span>Open the Tailoring Studio</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover/cta:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stitched seam between the cards and the sitemap */}
          <StitchRule
            charm="scissors"
            className="py-6 text-[#7A1F3D]/30 lg:py-7"
          />

          {/* ——— Sitemap columns ——— */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 lg:grid-cols-3 lg:gap-10">
            <FooterColumn title="Collections">
              <ul className="space-y-3">
                <FooterLink href="/shop?category=Three+Piece">
                  Three Piece
                </FooterLink>
                <FooterLink href="/shop?category=Two+Piece">
                  Two Piece
                </FooterLink>
                <FooterLink href="/shop?category=Tops">
                  Tops &amp; Tunics
                </FooterLink>
                <FooterLink href="/shop">View Full Collection</FooterLink>
              </ul>
            </FooterColumn>

            <FooterColumn title="Custom Tailoring">
              <ul className="space-y-3">
                <FooterLink href="/customize">Get It Custom Made</FooterLink>
                <FooterLink href="/customize?category=Three+Piece">
                  Bespoke Three Piece
                </FooterLink>
                <FooterLink href="/about">Our Craft &amp; Story</FooterLink>
                <FooterLink href="/account">
                  Account &amp; Saved Fit
                </FooterLink>
              </ul>
            </FooterColumn>

            <FooterColumn title="Visit &amp; Connect">
              <div className="space-y-3.5 text-sm text-[#4A4641]">
                <p className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#7A1F3D]" />
                  <span className="leading-relaxed">
                    {settings.atelierAddress}
                  </span>
                </p>
                <p className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-[#7A1F3D]" />
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="break-all transition-colors hover:text-[#7A1F3D]"
                  >
                    {settings.contactEmail}
                  </a>
                </p>
                <p className="flex items-center gap-2.5">
                  <MessageCircle className="h-4 w-4 shrink-0 text-[#7A1F3D]" />
                  <a
                    href={`https://wa.me/${cleanWhatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-[#7A1F3D]"
                  >
                    +{cleanWhatsapp}
                  </a>
                </p>
                <p className="flex items-start gap-2.5">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#7A1F3D]" />
                  <span className="whitespace-pre-line leading-relaxed">
                    {content.contact.hours}
                  </span>
                </p>
                <p className="inline-flex items-center gap-2 pt-0.5 text-[11px] uppercase tracking-[0.16em] text-[#292725]/55">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#A8B5A0]/70" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#A8B5A0]" />
                  </span>
                  Reservations on WhatsApp
                </p>
              </div>
            </FooterColumn>
          </div>

          {/* ——— Bottom bar ——— */}
          <div className="mt-8 flex flex-col items-center justify-between gap-5 border-t border-[#E5DEC9] pt-5 text-xs text-[#6E6A64] sm:flex-row">
            <p>
              &copy; {new Date().getFullYear()} {settings.brandName}. All rights
              reserved.
            </p>

            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => setLegalModal("privacy")}
                className="transition-colors hover:text-[#7A1F3D]"
              >
                Privacy Policy
              </button>
              <button
                type="button"
                onClick={() => setLegalModal("terms")}
                className="transition-colors hover:text-[#7A1F3D]"
              >
                Terms &amp; Conditions
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                const lenis = window.__lenis;
                if (lenis) lenis.scrollTo(0);
                else window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="group/top inline-flex items-center gap-2 border border-[#292725]/15 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-[#4A4641] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#7A1F3D]/60 hover:text-[#7A1F3D]"
            >
              <ArrowUp className="h-3.5 w-3.5 transition-transform duration-300 group-hover/top:-translate-y-0.5" />
              Top
            </button>
          </div>
        </div>
      </footer>

      {/* Privacy Policy & Terms Modal */}
      {legalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#292725]/60 backdrop-blur-xs"
            onClick={() => setLegalModal(null)}
          />
          <div className="relative z-10 max-h-[85svh] w-full max-w-xl overflow-y-auto border border-[#E5DEC9] bg-[#F8F5EF] p-6 text-[#292725] shadow-2xl sm:p-8">
            <div className="flex items-center justify-between border-b border-[#E5DEC9] pb-4">
              <h3 className="font-serif text-2xl">
                {legalModal === "privacy"
                  ? "Privacy Policy"
                  : "Terms & Conditions"}
              </h3>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                className="p-1.5 text-[#292725] transition-colors hover:text-[#7A1F3D]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 space-y-4 text-sm leading-relaxed text-[#6E6A64]">
              {legalModal === "privacy" ? (
                <>
                  <p>
                    At Reshma&rsquo;s Needle, your personal measurements,
                    contact details, and reference photographs are treated with
                    strict atelier confidentiality.
                  </p>
                  <p>
                    We collect your body measurements, delivery address, and
                    WhatsApp number solely to craft and deliver your ready-to-wear
                    and bespoke garments. Your information is never sold or
                    shared with third-party marketers.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Each custom-stitched garment at Reshma&rsquo;s Needle is
                    individually cut and tailored according to the measurements
                    submitted in your order.
                  </p>
                  <p>
                    Unstitched fabrics may be exchanged within 7 days if unused
                    in original packaging. For custom-stitched garments, our
                    atelier provides complimentary fit adjustments within 14
                    days of delivery.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
