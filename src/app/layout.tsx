import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/cormorant-garamond/500-italic.css";
import "@fontsource/cormorant-garamond/600-italic.css";
import "@fontsource/jost/300.css";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@fontsource/jost/600.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "./globals.css";
import { StoreProvider } from "@/context/StoreContext";
import { Navbar } from "@/components/Navbar";
import { CartDrawer } from "@/components/CartDrawer";
import { QuickViewModal } from "@/components/QuickViewModal";
import { Footer } from "@/components/Footer";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { ImageFallback } from "@/components/ImageFallback";
import { SmoothScroll } from "@/components/SmoothScroll";
import { getSiteContent, getStoreSettings } from "@/lib/serverData";

// Content is edited live from the admin dashboard, so render on request.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reshma's Needle | Luxury Women's Boutique & Custom Tailoring Atelier",
  description:
    "Elegance, Made Personal. Thoughtfully designed women's clothing and bespoke custom tailoring crafted to your exact measurements.",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [content, settings] = await Promise.all([
    getSiteContent(),
    getStoreSettings(),
  ]);

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F8F5EF] text-[#292725] antialiased selection:bg-[#7A1F3D] selection:text-[#F8F5EF]">
        <SmoothScroll>
          <StoreProvider initialContent={content} initialSettings={settings}>
            <Navbar />
            <CartDrawer />
            <QuickViewModal />
            <main className="flex-1">{children}</main>
            <Footer />
            <WhatsAppButton />
            <ImageFallback />
          </StoreProvider>
        </SmoothScroll>
      </body>
    </html>
  );
}
