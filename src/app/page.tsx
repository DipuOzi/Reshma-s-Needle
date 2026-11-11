"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Scissors, CheckCircle2 } from "lucide-react";
import { useStore, type ProductRecord } from "@/context/StoreContext";
import { ProductCard } from "@/components/ProductCard";
import { AtelierBackdrop, Motif, StitchRule } from "@/components/AtelierDecor";

// Each collection gets its own palette colour so the three cards read as a set
// of distinct, brand-coloured plates rather than three identical beige boxes.
// Every plate carries a faint atelier watermark motif for the premium feel.
const PLATES = [
  {
    bg: "bg-[#7A1F3D]",
    motif: "needle" as const,
    title: "text-[#F8F5EF]",
    body: "text-[#F8F5EF]/75",
    cta: "text-[#E8CE9C]",
    ring: "bg-[#F8F5EF]/15 group-hover:bg-[#E8CE9C] group-hover:text-[#7A1F3D]",
    hoverRing: "group-hover:shadow-[0_22px_48px_rgba(122,31,61,0.35)]",
  },
  {
    bg: "bg-sage-rich",
    motif: "button" as const,
    title: "text-[#292725]",
    body: "text-[#292725]/75",
    cta: "text-[#292725]",
    ring: "bg-[#292725]/10 group-hover:bg-[#292725] group-hover:text-[#F8F5EF]",
    hoverRing: "group-hover:shadow-[0_22px_48px_rgba(41,39,37,0.25)]",
  },
  {
    bg: "bg-charcoal-rich",
    motif: "scissors" as const,
    title: "text-[#F8F5EF]",
    body: "text-[#F8F5EF]/70",
    cta: "text-[#E8CE9C]",
    ring: "bg-[#F8F5EF]/10 group-hover:bg-[#E8CE9C] group-hover:text-[#292725]",
    hoverRing: "group-hover:shadow-[0_22px_48px_rgba(0,0,0,0.35)]",
  },
];

export default function HomePage() {
  const { content } = useStore();
  const home = content.home;
  const [featuredProducts, setFeaturedProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const collections = [
    { name: "Three Piece", description: home.collection1Description, image: home.collection1Image },
    { name: "Two Piece", description: home.collection2Description, image: home.collection2Image },
    { name: "Tops", description: home.collection3Description, image: home.collection3Image },
  ];

  const highlights = [
    { title: home.stat1Title, text: home.stat1Text },
    { title: home.stat2Title, text: home.stat2Text },
    { title: home.stat3Title, text: home.stat3Text },
  ];

  const madePoints = [
    home.madeBullet1,
    home.madeBullet2,
    home.madeBullet3,
    home.madeBullet4,
  ];

  useEffect(() => {
    async function loadFeatured() {
      try {
        const res = await fetch("/api/products");
        if (res.ok) {
          const data = await res.json();
          const all: ProductRecord[] = data.products || [];
          const picked = all.filter((p) => p.featured);
          setFeaturedProducts(picked.length > 0 ? picked.slice(0, 4) : all.slice(0, 4));
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  return (
    <div className="bg-[#F8F5EF]">
      {/* 1. Hero: ivory with a soft sage panel behind the campaign photograph */}
      <section className="relative flex min-h-[calc(100svh_-_96px)] items-center overflow-hidden bg-ivory-rich">
        {/* Two-tone backdrop: ivory on the left, sage panel on the right —
            same treatment as the About page story section */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 hidden w-[44%] bg-[#DEEAE0] lg:block"
        />
        {/* Scattered atelier motifs — needle, scissors, buttons, pins, tape */}
        <AtelierBackdrop
          items={[
            {
              kind: "button",
              className: "absolute right-10 top-16 hidden w-16 rotate-12 text-[#7CA982]/50 lg:block",
              animation: "spin",
            },
            {
              kind: "scissors",
              className: "absolute -left-8 bottom-6 hidden w-28 -rotate-[24deg] text-[#7CA982]/40 sm:block",
              animation: "sway",
            },
            {
              kind: "pin",
              className: "absolute left-[46%] top-24 hidden w-10 rotate-[160deg] text-[#7A1F3D]/20 lg:block",
              animation: "float",
            },
            {
              kind: "pin",
              className: "absolute left-[52%] top-40 hidden w-7 rotate-[190deg] text-[#7A1F3D]/15 lg:block",
            },
            {
              kind: "tape",
              className: "absolute bottom-2 left-[30%] hidden w-44 text-[#7A1F3D]/[0.09] lg:block",
              animation: "float",
            },
            {
              kind: "thimble",
              className: "absolute right-2 bottom-20 hidden w-12 rotate-6 text-[#7A1F3D]/[0.12] lg:block",
              animation: "float-slow",
            },
          ]}
        />

        <div className="relative mx-auto w-full max-w-[1440px] px-5 py-10 sm:px-8 md:py-16 lg:px-14 lg:py-20">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* On mobile the wrapper dissolves (display:contents) so the copy,
                the photograph, and the CTAs can be ordered separately:
                texts → image → buttons. On lg it is one left column again. */}
            <div className="max-lg:contents lg:order-1 lg:col-span-5 lg:space-y-7">
              <div className="order-1 space-y-6 sm:space-y-7">
                <div className="inline-flex items-center gap-3">
                  <span className="h-px w-8 bg-gradient-to-r from-[#7A1F3D] to-[#C6A15B]" />
                  <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-[#7A1F3D]">
                    {home.heroEyebrow}
                  </span>
                </div>

                <h1 className="font-serif text-5xl leading-[1.05] tracking-[-0.015em] text-[#292725] sm:text-6xl xl:text-[68px]">
                  {home.heroHeadline}
                </h1>

                <p className="max-w-md text-base font-light leading-relaxed text-[#6E6A64] sm:text-lg">
                  {home.heroSubtext}
                </p>
              </div>

              <div className="order-3 space-y-6 sm:space-y-7">
                <div className="flex flex-col items-stretch gap-4 pt-2 sm:flex-row sm:items-center">
                  <Link
                    href="/shop"
                    className="btn-sheen inline-flex items-center justify-center gap-3 bg-[#7A1F3D] px-8 py-4 text-xs uppercase tracking-[0.18em] text-[#F8F5EF] shadow-[0_10px_24px_rgba(122,31,61,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#61182F] hover:shadow-[0_14px_30px_rgba(198,161,91,0.35)]"
                  >
                    <span>{home.heroPrimaryCta}</span>
                    <ArrowRight className="h-4 w-4 stroke-[1.5]" />
                  </Link>

                  <Link
                    href="/customize"
                    className="btn-sheen inline-flex items-center justify-center gap-2.5 border border-[#292725]/80 bg-transparent px-8 py-4 text-xs uppercase tracking-[0.18em] text-[#292725] transition-colors hover:bg-[#292725] hover:text-[#F8F5EF]"
                  >
                    <Scissors className="h-4 w-4 stroke-[1.5]" />
                    <span>{home.heroSecondaryCta}</span>
                  </Link>
                </div>

                {/* Small stitched courtesy line under the hero CTAs */}
                <StitchRule
                  charm="none"
                  className="max-w-[260px] text-[#7A1F3D]/30"
                />

                <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-[#7CA982]">
                  <Motif kind="pin" className="w-5 h-4 [&>span]:h-4 [&>span]:w-5 [&_svg]:h-4 [&_svg]:w-5" />
                  <span>Cut · Stitch · Finish — By Hand</span>
                </p>
              </div>
            </div>

            <div className="order-2 lg:order-2 lg:col-span-7">
              <div className="mx-auto w-full max-w-[340px] bg-[linear-gradient(200deg,#E2EEE6,#D1E1D3)] p-5 sm:max-w-md sm:p-7 lg:mx-0 lg:max-w-none lg:bg-transparent lg:p-0">
                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="absolute -bottom-4 -right-4 hidden h-full w-full border border-[#C6A15B]/70 sm:block"
                  />
                  {/* Gold corner ornaments framing the photograph */}
                  <div
                    aria-hidden="true"
                    className="absolute -left-3 -top-3 hidden h-8 w-8 border-l-2 border-t-2 border-[#C6A15B]/80 sm:block"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute -right-3 -top-3 hidden h-8 w-8 border-r-2 border-t-2 border-[#C6A15B]/80 sm:block"
                  />
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#EFECE4] shadow-[0_28px_60px_rgba(122,31,61,0.2)] sm:aspect-[16/13] lg:aspect-[6/5]">
                    <img
                      src={home.heroImage}
                      alt="Reshma's Needle luxury fashion editorial portrait"
                      className="h-full w-full object-cover object-center"
                    />
                    <div className="absolute bottom-0 left-0 right-0 max-w-xs bg-wine-rich px-5 py-4 text-[#F8F5EF] sm:right-auto">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-[#E8CE9C]">
                        {home.featuredLookLabel}
                      </p>
                      <p className="mt-0.5 font-serif text-lg leading-snug">
                        {home.featuredLookTitle}
                      </p>
                      <Link
                        href={home.featuredLookLink}
                        className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-[#F8F5EF]/80 hover:text-white"
                      >
                        <span>Discover Piece</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                  {/* Tiny charm hanging off the photo frame */}
                  <Motif
                    kind="button"
                    className="absolute -right-5 top-8 hidden w-8 text-[#C6A15B]/70 sm:block"
                    animation="float"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Deep wine highlight strip, framed with champagne-gold hairlines */}
      <section className="relative bg-wine-rich text-[#F8F5EF]">
        <div aria-hidden="true" className="gold-hairline absolute top-0 left-0 h-px w-full" />
        <div aria-hidden="true" className="gold-hairline absolute bottom-0 left-0 h-px w-full" />
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 divide-y divide-[#F8F5EF]/15 px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8 lg:px-14">
          {highlights.map((item, index) => (
            <div
              key={index}
              className="relative py-5 text-center sm:px-8 sm:py-7 sm:text-left sm:first:pl-0 sm:last:pr-0"
            >
              <p className="font-serif text-2xl leading-tight">{item.title}</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#E8CE9C]/85">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Collections on white, each with a coloured caption plate.
          Fills the viewport with the cards vertically centred. */}
      <section className="relative flex min-h-screen flex-col justify-center bg-white py-10 lg:py-12">
        <AtelierBackdrop
          items={[
            {
              kind: "spool",
              className: "absolute right-6 top-10 hidden w-20 rotate-6 text-[#7CA982]/35 xl:block",
              animation: "float-slow",
            },
            {
              kind: "pin",
              className: "absolute left-8 top-32 hidden w-9 text-[#7A1F3D]/15 xl:block",
              animation: "float",
            },
          ]}
        />
        <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end lg:mb-10">
            <div>
              <p className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-[#7A1F3D]">
                <span className="h-px w-8 bg-gradient-to-r from-[#7A1F3D] to-[#C6A15B]" />
                {home.collectionsEyebrow}
              </p>
              <h2 className="mt-3 font-serif text-4xl text-[#292725] sm:text-5xl">
                {home.collectionsTitle}
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 self-start border-b border-[#292725] pb-1 text-xs uppercase tracking-[0.18em] text-[#292725] transition-colors hover:border-[#C6A15B] hover:text-[#7A1F3D] md:self-auto"
            >
              <span>View Full Collection</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            {collections.map((col, index) => {
              const plate = PLATES[index % PLATES.length];
              return (
                <Link
                  key={col.name}
                  href={`/shop?category=${encodeURIComponent(col.name)}`}
                  className={`group flex flex-col shadow-[0_14px_36px_rgba(41,39,37,0.1)] transition-all duration-500 ${plate.hoverRing}`}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#EFECE4] sm:aspect-[5/6]">
                    <img
                      src={col.image}
                      alt={col.name}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                    {/* Gold hairline inside the image on hover */}
                    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                      <div className="absolute inset-3 border border-[#F8F5EF]/0 transition-colors duration-500 group-hover:border-[#F8F5EF]/60" />
                    </div>
                  </div>

                  <div className={`${plate.bg} relative flex flex-1 flex-col gap-3 overflow-hidden p-6`}>
                    {/* Atelier watermark inside the caption plate */}
                    <Motif
                      kind={plate.motif}
                      className="absolute -bottom-3 -right-2 w-20 opacity-[0.16]"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <h3 className={`font-serif text-3xl ${plate.title}`}>{col.name}</h3>
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${plate.title} ${plate.ring}`}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                    <p className={`relative text-sm leading-relaxed ${plate.body}`}>
                      {col.description}
                    </p>
                    <span
                      className={`relative mt-auto inline-flex items-center gap-2 pt-2 text-[11px] uppercase tracking-[0.2em] ${plate.cta}`}
                    >
                      <Motif kind="pin" className="w-5 h-4 [&>span]:h-4 [&>span]:w-5 [&_svg]:h-4 [&_svg]:w-5" />
                      Explore
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Made For You: full-bleed deep wine with the atelier dressing */}
      <section className="relative overflow-hidden bg-wine-rich py-20 text-[#F8F5EF] lg:py-28">
        <AtelierBackdrop
          items={[
            {
              kind: "needle",
              className: "absolute -top-10 right-0 hidden w-64 rotate-[14deg] text-[#F8F5EF]/[0.08] xl:block",
              animation: "float-slow",
            },
            {
              kind: "thimble",
              className: "absolute left-[45%] top-14 hidden w-10 text-[#E8CE9C]/25 xl:block",
              animation: "float",
            },
            {
              kind: "pin",
              className: "absolute bottom-16 right-[38%] hidden w-8 text-[#F8F5EF]/25 xl:block",
              animation: "sway",
            },
          ]}
        />
        <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-6">
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="absolute -bottom-4 -left-4 hidden h-full w-full bg-[#7CA982]/90 sm:block"
                />
                {/* Gold corner ornaments */}
                <div
                  aria-hidden="true"
                  className="absolute -left-3 -top-3 z-10 hidden h-8 w-8 border-l-2 border-t-2 border-[#E8CE9C]/60 sm:block"
                />
                <div
                  aria-hidden="true"
                  className="absolute -bottom-3 -right-3 z-10 hidden h-8 w-8 border-b-2 border-r-2 border-[#E8CE9C]/60 sm:block"
                />
                <div className="relative aspect-[5/4] overflow-hidden bg-[#F8F5EF]">
                  <img
                    src={home.madeImage}
                    alt="Tailoring craftsmanship and handloom silk fabrics at Reshma's Needle"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6 lg:col-span-6">
              <div className="inline-flex items-center gap-2.5 text-xs uppercase tracking-[0.22em] text-[#E8CE9C]">
                <Scissors className="h-3.5 w-3.5" />
                <span>{home.madeEyebrow}</span>
              </div>

              <h2 className="font-serif text-4xl leading-[1.1] sm:text-5xl lg:text-[52px]">
                {home.madeTitle}
              </h2>

              <p className="max-w-xl text-base font-light leading-relaxed text-[#F8F5EF]/80 sm:text-lg">
                {home.madeText}
              </p>

              <StitchRule
                charm="none"
                className="max-w-md text-[#F8F5EF]/30"
              />

              <ul className="grid grid-cols-1 gap-3.5 text-sm sm:grid-cols-2">
                {madePoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-[#F8F5EF]/90">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#E8CE9C]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4">
                <Link
                  href="/customize"
                  className="btn-sheen inline-flex items-center gap-3 bg-[#F8F5EF] px-8 py-4 text-xs uppercase tracking-[0.18em] text-[#7A1F3D] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#7CA982] hover:text-[#292725]"
                >
                  <span>{home.madeCta}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Featured products on ivory */}
      <section className="relative overflow-hidden bg-ivory-rich py-20 lg:py-28">
        <AtelierBackdrop
          items={[
            {
              kind: "tape",
              className: "absolute right-0 top-16 hidden w-56 text-[#7A1F3D]/[0.09] xl:block",
              animation: "float-slow",
            },
            {
              kind: "button",
              className: "absolute left-6 bottom-24 hidden w-14 -rotate-12 text-[#7CA982]/45 xl:block",
              animation: "spin",
            },
            {
              kind: "spool",
              className: "absolute left-[42%] -top-6 hidden w-16 text-[#7A1F3D]/[0.12] xl:block",
              animation: "float",
            },
          ]}
        />
        <div className="relative mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-14">
          <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end lg:mb-16">
            <div>
              <p className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-[#7A1F3D]">
                <span className="h-px w-8 bg-gradient-to-r from-[#7A1F3D] to-[#C6A15B]" />
                {home.featuredEyebrow}
              </p>
              <h2 className="mt-3 font-serif text-4xl text-[#292725] sm:text-5xl">
                {home.featuredTitle}
              </h2>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 self-start border-b border-[#292725] pb-1 text-xs uppercase tracking-[0.18em] text-[#292725] transition-colors hover:border-[#C6A15B] hover:text-[#7A1F3D] md:self-auto"
            >
              <span>Browse All Pieces</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-8 lg:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="animate-pulse space-y-4">
                  <div className="aspect-[3/4] bg-[#E8E3D7]" />
                  <div className="h-5 w-3/4 bg-[#E8E3D7]" />
                  <div className="h-4 w-1/2 bg-[#E8E3D7]" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-8 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 6. Brand story on layered charcoal with the needle as a vignette */}
      <section className="relative overflow-hidden bg-charcoal-rich py-20 lg:py-28">
        <AtelierBackdrop
          items={[
            {
              kind: "needle",
              className: "absolute -left-10 bottom-0 hidden w-52 -rotate-[80deg] text-[#F8F5EF]/[0.09] lg:block",
              animation: "float-slow",
            },
            {
              kind: "needle",
              className: "absolute -right-12 top-0 hidden w-52 rotate-[80deg] text-[#F8F5EF]/[0.09] lg:block",
              animation: "float",
            },
            {
              kind: "pin",
              className: "absolute left-[12%] top-16 hidden w-8 -rotate-[20deg] text-[#E8CE9C]/25 xl:block",
              animation: "sway",
            },
            {
              kind: "pin",
              className: "absolute right-[12%] bottom-16 hidden w-8 rotate-[18deg] text-[#E8CE9C]/25 xl:block",
              animation: "sway",
            },
          ]}
        />
        <div className="relative mx-auto max-w-4xl space-y-6 px-5 text-center sm:px-8">
          <p className="text-xs uppercase tracking-[0.24em] text-[#E8CE9C]">
            {home.storyEyebrow}
          </p>
          <Motif
            kind="button"
            className="mx-auto h-8 w-8 rotate-12 text-[#E8CE9C]/50 [&>span]:h-8 [&>span]:w-8 [&_svg]:h-8 [&_svg]:w-8"
            animation="spin"
          />
          <h2 className="font-serif text-3xl italic leading-snug text-[#F8F5EF] sm:text-5xl">
            {home.storyQuote}
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[#F8F5EF]/75 sm:text-base">
            {home.storyText}
          </p>
          <div className="pt-2">
            <StitchRule
              charm="scissors"
              className="mx-auto max-w-xs text-[#E8CE9C]/50"
            />
          </div>
          <div className="pt-4">
            <Link
              href="/about"
              className="btn-sheen inline-flex items-center gap-2.5 bg-[#7A1F3D] px-8 py-4 text-xs uppercase tracking-[0.18em] text-[#F8F5EF] ring-1 ring-[#E8CE9C]/40 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#61182F]"
            >
              <span>Read Our Story</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
