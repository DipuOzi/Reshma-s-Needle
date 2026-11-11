import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Scissors, ArrowRight } from "lucide-react";
import { getSiteContent } from "@/lib/serverData";
import { AtelierBackdrop, Motif, StitchRule } from "@/components/AtelierDecor";

export const metadata: Metadata = {
  title: "About | Reshma's Needle",
  description:
    "The story and craftsmanship behind Reshma's Needle, a women's boutique and bespoke tailoring atelier.",
};

export default async function AboutPage() {
  const { about } = await getSiteContent();
  const pillars = [
    { tag: "01 / TEXTILE", title: about.pillar1Title, text: about.pillar1Text },
    { tag: "02 / PROPORTION", title: about.pillar2Title, text: about.pillar2Text },
    { tag: "03 / FINISHING", title: about.pillar3Title, text: about.pillar3Text },
  ];

  return (
    <div className="min-h-screen bg-ivory-rich">
      {/* Story: ivory with a sage panel behind the photograph */}
      <section className="relative overflow-hidden bg-ivory-rich py-16 lg:py-24">
        <AtelierBackdrop
          items={[
            {
              kind: "needle",
              className: "absolute right-[40%] -top-10 hidden w-48 text-[#7A1F3D]/[0.10] lg:block",
              animation: "float-slow",
            },
            {
              kind: "button",
              className: "absolute left-6 top-16 hidden w-14 -rotate-12 text-[#4A6B53]/50 xl:block",
              animation: "spin",
            },
            {
              kind: "pin",
              className: "absolute left-[48%] bottom-14 hidden w-9 rotate-[155deg] text-[#7A1F3D]/20 xl:block",
              animation: "float",
            },
            {
              kind: "tape",
              className: "absolute right-6 top-6 hidden w-44 text-[#7A1F3D]/[0.09] xl:block",
              animation: "float",
            },
          ]}
        />
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 hidden w-[44%] bg-[#7CA982] lg:block"
        />
        <div className="relative mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-12">
            <div className="space-y-6 md:col-span-6">
              <p className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-[#7A1F3D]">
                <span className="h-px w-8 bg-[#7A1F3D]" />
                {about.eyebrow}
              </p>
              <h1 className="font-serif text-4xl leading-[1.08] text-[#292725] sm:text-6xl">
                {about.title}
              </h1>
              <p className="text-base font-light leading-relaxed text-[#6E6A64] sm:text-lg">
                {about.lead}
              </p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-[#6E6A64] sm:text-base">
                {about.body}
              </p>
            </div>

            <div className="md:col-span-6 md:pl-6 lg:pl-10">
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="absolute -bottom-4 -right-4 hidden h-full w-full border border-[#C6A15B]/70 sm:block"
                />
                <div className="relative aspect-[4/5] overflow-hidden bg-[#EFECE4] shadow-[0_28px_60px_rgba(122,31,61,0.18)]">
                  <img
                    src={about.image}
                    alt="Reshma's Needle tailoring studio craftsmanship"
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* Small charm stitched to the frame */}
                <Motif
                  kind="thimble"
                  className="absolute -left-5 bottom-10 hidden w-9 rotate-6 text-[#4A6B53]/70 sm:block"
                  animation="float"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy: charcoal with atelier dressing */}
      <section className="relative overflow-hidden bg-charcoal-rich py-20 text-[#F8F5EF] lg:py-28">
        <div aria-hidden="true" className="gold-hairline absolute top-0 left-0 h-px w-full" />
        <AtelierBackdrop
          items={[
            {
              kind: "spool",
              className: "absolute right-10 top-14 hidden w-20 rotate-6 text-[#F8F5EF]/[0.08] xl:block",
              animation: "float-slow",
            },
            {
              kind: "needle",
              className: "absolute -left-8 bottom-0 hidden w-44 -rotate-[70deg] text-[#F8F5EF]/[0.07] xl:block",
              animation: "float",
            },
            {
              kind: "pin",
              className: "absolute right-[16%] bottom-20 hidden w-8 text-[#E8CE9C]/30 xl:block",
              animation: "sway",
            },
          ]}
        />
        <div className="mx-auto max-w-[1280px] px-5 sm:px-8">
          <div className="mx-auto mb-16 max-w-2xl space-y-3 text-center">
            <p className="text-xs uppercase tracking-[0.22em] text-[#4A6B53]">
              {about.philosophyEyebrow}
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl">
              {about.philosophyTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {pillars.map((pillar, index) => (
              <div
                key={pillar.tag}
                className={`relative space-y-4 border border-[#F8F5EF]/15 p-8 transition-colors hover:border-[#E8CE9C]/50 ${
                  index === 1 ? "bg-[#7A1F3D]" : "bg-[#F8F5EF]/[0.04]"
                }`}
              >
                <div aria-hidden="true" className="absolute left-8 right-8 top-0 h-px bg-gradient-to-r from-transparent via-[#C6A15B]/50 to-transparent" />
                <span className="font-mono text-xs text-[#E8CE9C]">
                  {pillar.tag}
                </span>
                <h3 className="font-serif text-2xl">{pillar.title}</h3>
                <p className="text-sm leading-relaxed text-[#F8F5EF]/70">
                  {pillar.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing call to action: soft sage */}
      <section className="relative overflow-hidden bg-sage-rich py-20">
        <Motif
          kind="scissors"
          className="absolute -right-8 -bottom-8 w-44 -rotate-[24deg] text-[#292725]/10"
          animation="sway"
        />
        <StitchRule
          charm="button"
          className="mx-auto max-w-sm pb-6 text-[#292725]/40"
        />
        <div className="relative mx-auto max-w-3xl space-y-6 px-5 text-center">
          <h2 className="relative font-serif text-3xl text-[#292725] sm:text-5xl">
            {about.ctaTitle}
          </h2>
          <div className="relative flex flex-wrap justify-center gap-4 pt-2">
            <Link
              href="/customize"
              className="btn-sheen inline-flex items-center gap-2 bg-[#7A1F3D] px-8 py-4 text-xs uppercase tracking-[0.18em] text-[#F8F5EF] transition-colors hover:bg-[#292725]"
            >
              <Scissors className="h-4 w-4" />
              <span>Customize Your Outfit</span>
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border border-[#292725] px-8 py-4 text-xs uppercase tracking-[0.18em] text-[#292725] transition-colors hover:bg-[#292725] hover:text-[#F8F5EF]"
            >
              <span>Contact the Atelier</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
