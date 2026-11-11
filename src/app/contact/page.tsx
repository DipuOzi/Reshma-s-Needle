"use client";

import React, { useState } from "react";
import {
  MapPin,
  Mail,
  MessageCircle,
  Clock,
  CheckCircle2,
  Send,
} from "lucide-react";
import { useStore } from "@/context/StoreContext";
import { AtelierBackdrop, Motif } from "@/components/AtelierDecor";

export default function ContactPage() {
  const { settings, showToast, content } = useStore();
  const page = content.contact;
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [subject, setSubject] = useState("Bespoke Tailoring Consultation");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const cleanWhatsapp = settings.whatsappNumber.replace(/[^0-9]/g, "");

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setSent(true);
    showToast("Inquiry prepared — you can also message us directly on WhatsApp");
  };

  return (
    <div className="bg-[#F8F5EF] min-h-screen">
      <section className="relative overflow-hidden bg-wine-rich py-14 text-[#F8F5EF] lg:py-20">
        <AtelierBackdrop
          items={[
            {
              kind: "needle",
              className: "absolute -right-6 top-0 hidden w-40 rotate-[70deg] text-[#F8F5EF]/[0.10] xl:block",
              animation: "float-slow",
            },
            {
              kind: "pin",
              className: "absolute right-[32%] top-12 hidden w-8 rotate-[20deg] text-[#E8CE9C]/40 xl:block",
              animation: "sway",
            },
            {
              kind: "button",
              className: "absolute right-[24%] bottom-8 hidden w-10 text-[#E8CE9C]/25 xl:block",
              animation: "spin",
            },
            {
              kind: "spool",
              className: "absolute left-[56%] top-10 hidden w-16 text-[#F8F5EF]/[0.08] xl:block",
              animation: "float",
            },
          ]}
        />
        <div aria-hidden="true" className="gold-hairline absolute bottom-0 left-0 h-px w-full" />
        <div className="relative max-w-[1200px] mx-auto px-5 sm:px-8">
          <div className="max-w-2xl space-y-3">
            <p className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-[#E8CE9C]">
              <span className="h-px w-8 bg-[#E8CE9C]" />
              {page.eyebrow}
            </p>
            <h1 className="font-serif text-4xl sm:text-6xl text-[#F8F5EF]">
              {page.title}
            </h1>
            <p className="text-sm sm:text-base text-[#F8F5EF]/75 leading-relaxed">
              {page.intro}
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-14 lg:py-20">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Info Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="hidden lg:block aspect-[4/3] overflow-hidden border border-[#E5DEC9] bg-[#EFECE4]">
              <img
                src={page.image}
                alt="Inside the Reshma's Needle atelier"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="relative bg-white border border-[#E5DEC9] border-t-[3px] border-t-[#7CA982] p-7 space-y-6 shadow-[0_18px_40px_rgba(41,39,37,0.08)]">
              {/* Atelier charm in the card corner */}
              <Motif
                kind="button"
                className="absolute right-5 top-5 w-10 text-[#4A6B53]/50"
                animation="spin"
              />
              <div className="flex items-start gap-3.5">
                <MessageCircle className="w-5 h-5 text-[#7A1F3D] shrink-0 mt-1" />
                <div>
                  <h3 className="text-xs uppercase tracking-[0.16em] text-[#292725] font-medium">
                    Direct WhatsApp Concierge
                  </h3>
                  <p className="text-sm text-[#6E6A64] mt-1">
                    +{cleanWhatsapp}
                  </p>
                  <a
                    href={`https://wa.me/${cleanWhatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-sheen mt-3 inline-flex items-center gap-2 bg-wine-rich text-[#F8F5EF] px-5 py-2.5 text-xs uppercase tracking-[0.15em]"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>
              </div>

              <div className="pt-5 border-t border-[#E5DEC9] flex items-start gap-3.5">
                <MapPin className="w-5 h-5 text-[#7A1F3D] shrink-0 mt-1" />
                <div>
                  <h3 className="text-xs uppercase tracking-[0.16em] text-[#292725] font-medium">
                    Atelier Studio Address
                  </h3>
                  <p className="text-sm text-[#6E6A64] mt-1">
                    {settings.atelierAddress}
                  </p>
                </div>
              </div>

              <div className="pt-5 border-t border-[#E5DEC9] flex items-start gap-3.5">
                <Mail className="w-5 h-5 text-[#7A1F3D] shrink-0 mt-1" />
                <div>
                  <h3 className="text-xs uppercase tracking-[0.16em] text-[#292725] font-medium">
                    Email
                  </h3>
                  <p className="text-sm text-[#6E6A64] mt-1">
                    {settings.contactEmail}
                  </p>
                </div>
              </div>

              <div className="pt-5 border-t border-[#E5DEC9] flex items-start gap-3.5">
                <Clock className="w-5 h-5 text-[#7A1F3D] shrink-0 mt-1" />
                <div>
                  <h3 className="text-xs uppercase tracking-[0.16em] text-[#292725] font-medium">
                    Atelier Fitting Hours
                  </h3>
                  <p className="text-sm text-[#6E6A64] mt-1">
                    {page.hours}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Form */}
          <div className="relative lg:col-span-7 bg-white border border-[#E5DEC9] border-t-[3px] border-t-[#7A1F3D] p-7 sm:p-10 shadow-[0_22px_50px_rgba(122,31,61,0.10)]">
            {sent ? (
              <div className="py-10 text-center space-y-4">
                <CheckCircle2 className="w-10 h-10 text-[#4A6B53] mx-auto" />
                <h2 className="font-serif text-3xl text-[#292725]">
                  Thank You, {name}
                </h2>
                <p className="text-sm text-[#6E6A64] max-w-md mx-auto">
                  Your message has been logged. For immediate fabric or measurement
                  assistance, click below to send your message directly to our
                  atelier WhatsApp.
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <a
                    href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(
                      `Hello Reshma's Needle, my name is ${name}.\nSubject: ${subject}\n\n${message}`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-wine-rich text-[#F8F5EF] px-6 py-3 text-xs uppercase tracking-[0.16em]"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Send via WhatsApp Now</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setSent(false);
                      setMessage("");
                    }}
                    className="px-6 py-3 border border-[#292725] text-xs uppercase tracking-[0.16em]"
                  >
                    Send Another Note
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-5">
                <h2 className="font-serif text-2xl text-[#292725] border-b border-[#E5DEC9] pb-3">
                  {page.formTitle}
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                      className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                      WhatsApp / Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+880 17XX-XXXXXX"
                      className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                    Inquiry Topic
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] text-sm"
                  >
                    <option value="Bespoke Tailoring Consultation">
                      Bespoke Tailoring Consultation
                    </option>
                    <option value="Three Piece Unstitched / Stitched Inquiry">
                      Three Piece Unstitched / Stitched Inquiry
                    </option>
                    <option value="Existing Order Status">
                      Existing Order Status
                    </option>
                    <option value="Private Atelier Appointment">
                      Private Atelier Appointment
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#292725] mb-1.5">
                    Your Message *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us how we can assist you..."
                    className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-sheen inline-flex items-center gap-2 bg-wine-rich hover:bg-[#61182F] text-[#F8F5EF] px-8 py-4 text-xs uppercase tracking-[0.18em] transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
