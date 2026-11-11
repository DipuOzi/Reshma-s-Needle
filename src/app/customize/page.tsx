"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Scissors,
  Upload,
  MessageCircle,
  Sparkles,
  Copy,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import {
  useStore,
  formatPrice,
  type ProductRecord,
} from "@/context/StoreContext";
import {
  TailoringMannequin,
  MEASUREMENT_SPECS,
} from "@/components/TailoringMannequin";
import { AtelierBackdrop, Motif, StitchRule } from "@/components/AtelierDecor";

const STEPS = [
  { id: 1, title: "Select Outfit", short: "Outfit" },
  { id: 2, title: "Select Design", short: "Design" },
  { id: 3, title: "Body Measurements", short: "Measure" },
  { id: 4, title: "Your Details", short: "Details" },
  { id: 5, title: "Review & WhatsApp", short: "Review" },
];

function CustomizeWizardContent() {
  const searchParams = useSearchParams();
  const preselectedProductId = searchParams.get("productId");
  const preselectedCategoryParam = searchParams.get("category");
  const preselectedColorParam = searchParams.get("color");

  const { settings, customer, showToast, content } = useStore();
  const studio = content.customize;
  const OUTFIT_TYPES: Array<{
    category: "Three Piece" | "Two Piece" | "Tops";
    subtitle: string;
    description: string;
    image: string;
  }> = [
    { category: "Three Piece", subtitle: "Kameez, Tailored Trouser & Dupatta", description: studio.threePieceDescription, image: studio.threePieceImage },
    { category: "Two Piece", subtitle: "Structured Tunic & Tailored Trouser", description: studio.twoPieceDescription, image: studio.twoPieceImage },
    { category: "Tops", subtitle: "Bespoke Kurta, Tunic or Blouse", description: studio.topsDescription, image: studio.topsImage },
  ];

  const [step, setStep] = useState<number>(1);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);

  // Step 1 & 2 state
  const [selectedCategory, setSelectedCategory] = useState<
    "Three Piece" | "Two Piece" | "Tops"
  >("Three Piece");
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(
    null
  );
  const [selectedColor, setSelectedColor] = useState<string>("Deep Wine");
  const [tailoringOption, setTailoringOption] = useState<string>(
    "Bespoke Custom Stitched"
  );

  // Step 3 state: Measurements
  const [unit, setUnit] = useState<"inches" | "cm">("inches");
  const [measurements, setMeasurements] = useState<Record<string, string>>({
    shoulder: "",
    bust: "",
    waist: "",
    hip: "",
    sleeveLength: "",
    armhole: "",
    upperArm: "",
    kameezLength: "",
    trouserLength: "",
    trouserWaist: "",
    trouserHip: "",
    neckStyle: "",
  });
  const [activeMeasurementKey, setActiveMeasurementKey] =
    useState<string>("shoulder");
  const [measurementSection, setMeasurementSection] = useState<
    "upper" | "arm" | "lower"
  >("upper");
  const [referenceImageName, setReferenceImageName] = useState<string>("");
  const [referenceImageData, setReferenceImageData] = useState<string>("");
  const [specialNotes, setSpecialNotes] = useState<string>("");

  // Step 4 state: Customer info
  const [customerName, setCustomerName] = useState<string>("");
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");
  const [deliveryAddress, setDeliveryAddress] = useState<string>("");
  const [additionalInstructions, setAdditionalInstructions] =
    useState<string>("");

  // Validation & Submission state
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submittedRequestNumber, setSubmittedRequestNumber] = useState<
    string | null
  >(null);
  const [generatedWhatsappUrl, setGeneratedWhatsappUrl] = useState<
    string | null
  >(null);
  const [generatedMessageText, setGeneratedMessageText] = useState<string>("");

  // Pre-fill customer details if logged in
  useEffect(() => {
    if (customer) {
      setCustomerName((prev) => prev || customer.name);
      setWhatsappNumber((prev) => prev || customer.whatsapp || customer.phone);
      setDeliveryAddress((prev) => prev || customer.address);
    }
  }, [customer]);

  // Load products and handle automatic product carryover from Product Details page
  useEffect(() => {
    async function initProducts() {
      setLoadingProducts(true);
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const all: ProductRecord[] = data.products || [];
          setProducts(all);

          if (preselectedProductId) {
            const match = all.find(
              (p) =>
                String(p.id) === preselectedProductId ||
                p.slug === preselectedProductId
            );
            if (match) {
              setSelectedCategory(match.category);
              setSelectedProduct(match);
              setSelectedColor(
                preselectedColorParam || match.colors[0] || "Deep Wine"
              );
              // Automatically advance to Step 3 (Measurements) since outfit & design are already selected!
              setStep(3);
              return;
            }
          }

          if (
            preselectedCategoryParam === "Three Piece" ||
            preselectedCategoryParam === "Two Piece" ||
            preselectedCategoryParam === "Tops"
          ) {
            setSelectedCategory(preselectedCategoryParam);
            const firstInCat = all.find(
              (p) => p.category === preselectedCategoryParam
            );
            if (firstInCat) {
              setSelectedProduct(firstInCat);
              setSelectedColor(firstInCat.colors[0] || "Warm Ivory");
            }
            setStep(2);
            return;
          }

          // Default selection
          const first = all[0];
          if (first) {
            setSelectedProduct(first);
            setSelectedColor(first.colors[0] || "Deep Wine");
          }
        }
      } catch {
        // ignore
      } finally {
        setLoadingProducts(false);
      }
    }
    initProducts();
  }, [preselectedProductId, preselectedCategoryParam, preselectedColorParam]);

  const categoryProducts = products.filter(
    (p) => p.category === selectedCategory
  );

  const relevantSpecs = MEASUREMENT_SPECS.filter((s) =>
    s.categories.includes(selectedCategory)
  );
  const requiredSpecs = relevantSpecs.filter((s) => s.required);

  const handleCategoryChange = (cat: "Three Piece" | "Two Piece" | "Tops") => {
    setSelectedCategory(cat);
    const firstMatch = products.find((p) => p.category === cat) || null;
    setSelectedProduct(firstMatch);
    if (firstMatch) {
      setSelectedColor(firstMatch.colors[0] || "Warm Ivory");
    }
  };

  const handleMeasurementChange = (key: string, val: string) => {
    setMeasurements((prev) => ({
      ...prev,
      [key]: val,
    }));
    setValidationError(null);
  };

  const handleUnitChange = (nextUnit: "inches" | "cm") => {
    if (nextUnit === unit) return;

    const conversionFactor = nextUnit === "cm" ? 2.54 : 1 / 2.54;
    setMeasurements((previous) =>
      Object.fromEntries(
        Object.entries(previous).map(([key, value]) => {
          if (key === "neckStyle" || !value || !Number.isFinite(Number(value))) {
            return [key, value];
          }
          return [key, String(Number((Number(value) * conversionFactor).toFixed(1)))];
        })
      )
    );
    setUnit(nextUnit);
    showToast(
      `Measurements converted to ${nextUnit === "cm" ? "centimeters" : "inches"}`
    );
  };

  const handleFillSavedOrSample = (mode: "saved" | "sample") => {
    if (mode === "saved" && customer?.savedMeasurements) {
      setUnit(customer.measurementUnit || "inches");
      setMeasurements((prev) => ({
        ...prev,
        ...customer.savedMeasurements,
      }));
      showToast("Loaded your saved measurement profile");
      return;
    }

    // Standard Medium sample in current unit
    if (unit === "inches") {
      setMeasurements({
        shoulder: "14.5",
        bust: "36",
        waist: "30",
        hip: "39",
        sleeveLength: "21",
        armhole: "16.5",
        upperArm: "12",
        kameezLength: selectedCategory === "Tops" ? "32" : "44",
        trouserLength: "38",
        trouserWaist: "31",
        trouserHip: "40",
        neckStyle: "Boat Neckline with 6 inch front depth",
      });
    } else {
      setMeasurements({
        shoulder: "37",
        bust: "91.5",
        waist: "76",
        hip: "99",
        sleeveLength: "53",
        armhole: "42",
        upperArm: "30.5",
        kameezLength: selectedCategory === "Tops" ? "81" : "112",
        trouserLength: "96.5",
        trouserWaist: "79",
        trouserHip: "101.5",
        neckStyle: "Boat Neckline with 15 cm front depth",
      });
    }
    setValidationError(null);
    showToast(`Filled standard Boutique Medium (${unit}) as a starting point`);
  };

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReferenceImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setReferenceImageData(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const validateCurrentStep = (targetStep: number): boolean => {
    setValidationError(null);

    if (targetStep > 2 && !selectedProduct) {
      setValidationError("Please select a design to customize.");
      return false;
    }

    if (targetStep > 3) {
      const missing = requiredSpecs.filter(
        (spec) => !measurements[spec.key] || !measurements[spec.key].trim()
      );
      if (missing.length > 0) {
        setValidationError(
          `Please enter required measurements: ${missing
            .map((m) => m.label)
            .join(", ")}.`
        );
        return false;
      }
    }

    if (targetStep > 4) {
      if (
        !customerName.trim() ||
        !whatsappNumber.trim() ||
        !deliveryAddress.trim()
      ) {
        setValidationError(
          "Please provide your Full Name, WhatsApp Number, and Delivery Address."
        );
        return false;
      }
    }

    return true;
  };

  const goToStep = (nextStep: number) => {
    if (nextStep > step) {
      if (!validateCurrentStep(nextStep)) return;
    } else {
      setValidationError(null);
    }
    setStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const buildWhatsappMessage = (reqNum: string) => {
    const lines: string[] = [
      `*RESHMA'S NEEDLE — BESPOKE CUSTOM ORDER*`,
      `Order Ref: ${reqNum}`,
      `----------------------------------`,
      `*Outfit Category:* ${selectedCategory}`,
      `*Selected Design:* ${selectedProduct?.name || "Custom Design"}`,
      `*Preferred Shade:* ${selectedColor}`,
      `*Tailoring Option:* ${tailoringOption}`,
      `*Estimated Price:* ${
        selectedProduct
          ? formatPrice(selectedProduct.price + selectedProduct.stitchingFee)
          : "Upon Consultation"
      }`,
      ``,
      `*BODY MEASUREMENTS (${unit.toUpperCase()}):*`,
    ];

    relevantSpecs.forEach((spec) => {
      const val = measurements[spec.key]?.trim();
      if (val) {
        lines.push(`• ${spec.label.replace(" (Optional)", "")}: ${val} ${unit}`);
      }
    });

    if (measurements.neckStyle?.trim()) {
      lines.push(`• Neck Design / Style: ${measurements.neckStyle.trim()}`);
    }

    if (referenceImageName) {
      lines.push(
        `• Reference Image: ${referenceImageName} (I will attach this photo in our WhatsApp chat)`
      );
    }

    if (specialNotes.trim()) {
      lines.push(`• Tailoring Notes: ${specialNotes.trim()}`);
    }

    lines.push(
      ``,
      `*CUSTOMER DETAILS:*`,
      `• Name: ${customerName.trim()}`,
      `• WhatsApp: ${whatsappNumber.trim()}`,
      `• Delivery Address: ${deliveryAddress.trim()}`
    );

    if (additionalInstructions.trim()) {
      lines.push(`• Delivery Instructions: ${additionalInstructions.trim()}`);
    }

    return lines.join("\n");
  };

  const handleSubmitViaWhatsapp = async () => {
    if (!validateCurrentStep(5)) return;
    setSubmitting(true);
    setValidationError(null);

    try {
      const res = await fetch("/api/tailoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          productId: selectedProduct?.id ?? null,
          productName: selectedProduct?.name || `${selectedCategory} Bespoke`,
          productImage: selectedProduct?.images[0] || null,
          selectedColor,
          tailoringOption,
          unit,
          measurements,
          referenceImageName: referenceImageName || null,
          referenceImageData: referenceImageData || null,
          specialNotes,
          customerName,
          whatsappNumber,
          deliveryAddress,
          additionalInstructions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setValidationError(
          data.error || "Could not submit your tailoring request."
        );
        setSubmitting(false);
        return;
      }

      const reqNum = data.request?.requestNumber || "BESP-2026-NEW";
      setSubmittedRequestNumber(reqNum);

      const messageText = buildWhatsappMessage(reqNum);
      setGeneratedMessageText(messageText);

      const cleanOwnerPhone = settings.whatsappNumber.replace(/[^0-9]/g, "");
      const waUrl = `https://wa.me/${cleanOwnerPhone}?text=${encodeURIComponent(
        messageText
      )}`;
      setGeneratedWhatsappUrl(waUrl);

      // Open WhatsApp in new tab/app
      window.open(waUrl, "_blank", "noopener,noreferrer");
    } catch {
      setValidationError(
        "A network error occurred while saving your tailoring order. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-ivory-rich min-h-screen pb-24">
      {/* Studio Header */}
      <section className="relative overflow-hidden bg-wine-rich py-12 text-[#F8F5EF] lg:py-16">
        <AtelierBackdrop
          items={[
            {
              kind: "needle",
              className:
                "absolute -right-6 -top-12 w-40 lg:w-52 rotate-[16deg] text-[#F8F5EF]/[0.10]",
              animation: "float-slow",
            },
            {
              kind: "button",
              className:
                "absolute left-6 top-10 w-9 text-[#E8CE9C]/[0.18]",
              animation: "spin",
            },
            {
              kind: "pin",
              className:
                "absolute left-[42%] top-5 w-8 rotate-[24deg] text-[#F8F5EF]/[0.14]",
              animation: "sway",
            },
          ]}
        />
        <div className="relative max-w-[1280px] mx-auto px-5 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#E8CE9C]">
                <Scissors className="w-3.5 h-3.5" />
                <span>{studio.eyebrow}</span>
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl text-[#F8F5EF] mt-2">
                {studio.title}
              </h1>
              <p className="text-sm sm:text-base text-[#F8F5EF]/75 mt-2 max-w-xl">
                {studio.intro}
              </p>
            </div>

            {selectedProduct && (
              <div className="bg-[#F8F5EF] border border-[#E5DEC9] p-3.5 flex items-center gap-3.5 max-w-xs">
                <img
                  src={
                    selectedProduct.images[0] ||
                    "/images/collection-three-piece.jpg"
                  }
                  alt={selectedProduct.name}
                  className="w-12 h-16 object-cover border border-[#E5DEC9] shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#7A1F3D]">
                    Selected Design
                  </p>
                  <p className="font-serif text-base text-[#292725] truncate">
                    {selectedProduct.name}
                  </p>
                  <p className="text-xs text-[#6E6A64]">
                    {selectedColor} &middot;{" "}
                    {formatPrice(
                      selectedProduct.price + selectedProduct.stitchingFee
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 5-Step Progress Indicator */}
          <div className="mt-10 grid grid-cols-5 gap-1 border-t border-[#F8F5EF]/20 pt-6 sm:gap-2">
            {STEPS.map((s) => {
              const isCurrent = step === s.id;
              const isCompleted = step > s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goToStep(s.id)}
                  className={`text-left p-1.5 sm:p-3 border transition-all ${
                    isCurrent
                      ? "border-[#F8F5EF] bg-[#F8F5EF] text-[#7A1F3D]"
                      : isCompleted
                      ? "border-[#7CA982] bg-[#7CA982] text-[#292725]"
                      : "border-[#F8F5EF]/25 bg-transparent text-[#F8F5EF]/70 hover:border-[#F8F5EF]/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 font-mono text-[9px] uppercase tracking-wider sm:text-[10px]">
                    <span>Step 0{s.id}</span>
                    {isCompleted && (
                      <Check className="hidden h-3 w-3 shrink-0 text-[#292725] min-[360px]:block sm:h-3.5 sm:w-3.5" />
                    )}
                  </div>
                  <p className="mt-1 text-[10px] font-medium leading-snug sm:text-sm">
                    <span className="sm:hidden">{s.short}</span>
                    <span className="hidden sm:inline">{s.title}</span>
                  </p>
                </button>
              );
            })}
          </div>
        </div>
        <div className="gold-hairline absolute bottom-0 left-0 w-full" />
      </section>

      {/* Main Step Container */}
      <div className="max-w-[1280px] mx-auto px-5 sm:px-8 pt-10">
        {validationError && (
          <div className="mb-8 p-4 bg-[#9E3B3B]/10 border border-[#9E3B3B] text-[#9E3B3B] flex items-start gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        {/* STEP 1: SELECT YOUR OUTFIT */}
        {step === 1 && (
          <div className="space-y-8 animate-fade-in">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#7A1F3D]">
                Step 1 of 5
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#292725] mt-1">
                Select Your Outfit Silhouette
              </h2>
              <p className="text-sm text-[#6E6A64] mt-1">
                Choose the garment category you wish to have custom tailored.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {OUTFIT_TYPES.map((item) => {
                const isSelected = selectedCategory === item.category;
                return (
                  <button
                    key={item.category}
                    type="button"
                    onClick={() => handleCategoryChange(item.category)}
                    className={`group text-left border transition-all flex flex-col overflow-hidden ${
                      isSelected
                        ? "border-[#7A1F3D] ring-1 ring-[#7A1F3D] bg-white"
                        : "border-[#E5DEC9] bg-[#F8F5EF] hover:border-[#292725]"
                    }`}
                  >
                    <div className="aspect-[4/3] w-full bg-[#EFECE4] overflow-hidden relative">
                      <img
                        src={item.image}
                        alt={item.category}
                        className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                      />
                      {isSelected && (
                        <span className="absolute top-3 right-3 bg-[#7A1F3D] text-[#F8F5EF] px-3 py-1 text-[10px] uppercase tracking-[0.16em] flex items-center gap-1">
                          <Check className="w-3 h-3" /> Selected
                        </span>
                      )}
                    </div>
                    <div className="p-6 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.16em] text-[#7A1F3D]">
                          {item.subtitle}
                        </p>
                        <h3 className="font-serif text-3xl text-[#292725] mt-1">
                          {item.category}
                        </h3>
                        <p className="text-xs text-[#6E6A64] leading-relaxed mt-2">
                          {item.description}
                        </p>
                      </div>
                      <span className="pt-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[#292725] font-medium">
                        <span>Select {item.category}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="btn-sheen inline-flex w-full items-center justify-center gap-2 bg-[#7A1F3D] px-6 py-4 text-xs uppercase tracking-[0.18em] text-[#F8F5EF] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#61182F] sm:w-auto sm:px-8"
              >
                <span>Continue to Design Selection</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SELECT YOUR DESIGN */}
        {step === 2 && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#7A1F3D]">
                  Step 2 of 5 &middot; {selectedCategory}
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl text-[#292725] mt-1">
                  Select Your Exact Design &amp; Shade
                </h2>
                <p className="text-sm text-[#6E6A64] mt-1">
                  Choose from our available {selectedCategory} designs below.
                </p>
              </div>

              <button
                type="button"
                onClick={() => goToStep(1)}
                className="text-xs uppercase tracking-[0.15em] text-[#6E6A64] hover:text-[#292725] inline-flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Change Outfit Category</span>
              </button>
            </div>

            {loadingProducts ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-96 bg-[#EFECE4] animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                {categoryProducts.map((prod) => {
                  const isSelected = selectedProduct?.id === prod.id;
                  return (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setSelectedProduct(prod);
                        setSelectedColor(prod.colors[0] || "Warm Ivory");
                      }}
                      className={`cursor-pointer border transition-all flex flex-col ${
                        isSelected
                          ? "border-[#7A1F3D] ring-1 ring-[#7A1F3D] bg-white"
                          : "border-[#E5DEC9] bg-[#F8F5EF] hover:border-[#292725]"
                      }`}
                    >
                      <div className="aspect-[3/4] bg-[#EFECE4] overflow-hidden relative">
                        <img
                          src={
                            prod.images[0] ||
                            "/images/collection-three-piece.jpg"
                          }
                          alt={prod.name}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <span className="absolute top-3 right-3 bg-[#7A1F3D] text-[#F8F5EF] px-3 py-1 text-[10px] uppercase tracking-[0.16em] flex items-center gap-1">
                            <Check className="w-3 h-3" /> Selected Design
                          </span>
                        )}
                      </div>

                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-serif text-2xl text-[#292725]">
                            {prod.name}
                          </h3>
                          <p className="text-xs text-[#7A1F3D] font-medium mt-1">
                            Custom Stitched Total:{" "}
                            {formatPrice(prod.price + prod.stitchingFee)}{" "}
                            <span className="text-[#6E6A64] font-normal">
                              (Fabric {formatPrice(prod.price)} + Stitching{" "}
                              {formatPrice(prod.stitchingFee)})
                            </span>
                          </p>
                          <p className="text-xs text-[#6E6A64] mt-2 line-clamp-2">
                            {prod.fabricDetails}
                          </p>
                        </div>

                        {isSelected && (
                          <div
                            className="pt-3 border-t border-[#E5DEC9]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <label className="block text-[10px] uppercase tracking-[0.16em] text-[#292725] mb-1.5">
                              Select Shade:
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {prod.colors.map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setSelectedColor(c)}
                                  className={`px-2.5 py-1 text-[11px] border ${
                                    selectedColor === c
                                      ? "bg-[#7A1F3D] text-[#F8F5EF] border-[#7A1F3D]"
                                      : "bg-[#F8F5EF] text-[#292725] border-[#E5DEC9]"
                                  }`}
                                >
                                  {c}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-[#E5DEC9] pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="inline-flex w-full items-center justify-center gap-2 border border-[#292725] px-6 py-3.5 text-xs uppercase tracking-[0.16em] text-[#292725] sm:w-auto"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Step</span>
              </button>

              <button
                type="button"
                onClick={() => goToStep(3)}
                className="btn-sheen inline-flex w-full items-center justify-center gap-2 bg-[#7A1F3D] px-6 py-4 text-xs uppercase tracking-[0.18em] text-[#F8F5EF] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#61182F] sm:w-auto sm:px-8"
              >
                <span>Enter Body Measurements</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ENTER BODY MEASUREMENTS */}
        {step === 3 && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#E5DEC9] pb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#7A1F3D]">
                  Step 3 of 5 &middot; Tailoring Specification for{" "}
                  {selectedProduct?.name || selectedCategory}
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl text-[#292725] mt-1">
                  Enter Your Body Measurements
                </h2>
                <p className="text-sm text-[#6E6A64] mt-1">
                  Select any field or click a hotspot on the tailoring mannequin
                  to view how that measurement is taken.
                </p>
              </div>

              {/* Unit Toggle & Quick Fill Helpers */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex border border-[#292725] bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => handleUnitChange("inches")}
                    className={`px-4 py-2 text-xs uppercase tracking-[0.14em] transition-colors ${
                      unit === "inches"
                        ? "bg-[#7A1F3D] text-[#F8F5EF]"
                        : "text-[#292725]"
                    }`}
                  >
                    Inches (in)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnitChange("cm")}
                    className={`px-4 py-2 text-xs uppercase tracking-[0.14em] transition-colors ${
                      unit === "cm"
                        ? "bg-[#7A1F3D] text-[#F8F5EF]"
                        : "text-[#292725]"
                    }`}
                  >
                    Centimeters (cm)
                  </button>
                </div>

                {customer?.savedMeasurements && (
                  <button
                    type="button"
                    onClick={() => handleFillSavedOrSample("saved")}
                    className="px-4 py-2.5 border border-[#7A1F3D] text-[#7A1F3D] text-xs uppercase tracking-[0.14em] hover:bg-[#7A1F3D] hover:text-[#F8F5EF] transition-colors"
                  >
                    Use My Saved Profile
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleFillSavedOrSample("sample")}
                  className="px-4 py-2.5 border border-[#E5DEC9] bg-white text-[#292725] text-xs uppercase tracking-[0.14em] hover:border-[#292725] transition-colors"
                >
                  Pre-fill Standard M Guide
                </button>
              </div>
            </div>

            {/* Split Layout: Left Interactive Mannequin (5 cols) | Right Progressive Form (7 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 lg:sticky lg:top-28">
                <TailoringMannequin
                  category={selectedCategory}
                  activeKey={activeMeasurementKey}
                  onSelectKey={(key) => {
                    setActiveMeasurementKey(key);
                    const selectedSpec = relevantSpecs.find(
                      (spec) => spec.key === key
                    );
                    if (selectedSpec && selectedSpec.group !== "style") {
                      setMeasurementSection(selectedSpec.group);
                    }
                  }}
                  onValueChange={handleMeasurementChange}
                  values={measurements}
                  unit={unit}
                />
              </div>

              <div className="lg:col-span-7 space-y-6">
                {/* Progressive Section Tabs so users are not overwhelmed */}
                <div className="grid grid-cols-1 gap-1.5 border border-[#E5DEC9] bg-[#EFECE4] p-1.5 sm:grid-cols-3 sm:gap-2">
                  {[
                    { id: "upper", label: "1. Torso & Bodice" },
                    { id: "arm", label: "2. Sleeve & Arm" },
                    {
                      id: "lower",
                      label:
                        selectedCategory === "Tops"
                          ? "3. Top Length"
                          : "3. Length & Trouser",
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() =>
                        setMeasurementSection(
                          tab.id as "upper" | "arm" | "lower"
                        )
                      }
                      className={`py-2.5 px-3 text-xs uppercase tracking-[0.13em] transition-colors ${
                        measurementSection === tab.id
                          ? "bg-[#7A1F3D] text-[#F8F5EF] font-medium"
                          : "text-[#292725] hover:bg-[#F8F5EF]"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Active Group Fields */}
                <div className="bg-white border border-[#E5DEC9] p-6 sm:p-8 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {relevantSpecs
                      .filter((spec) => spec.group === measurementSection)
                      .map((spec) => {
                        const isFocused = activeMeasurementKey === spec.key;
                        return (
                          <div key={spec.key} className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label
                                htmlFor={`meas-${spec.key}`}
                                className="text-xs uppercase tracking-[0.14em] text-[#292725] font-medium"
                              >
                                {spec.label.replace(" (Optional)", "")}
                              </label>
                              <span
                                className={`text-[10px] uppercase tracking-wider px-2 py-0.5 ${
                                  spec.required
                                    ? "bg-[#7A1F3D]/10 text-[#7A1F3D]"
                                    : "bg-[#EFECE4] text-[#6E6A64]"
                                }`}
                              >
                                {spec.required ? "Required" : "Optional"}
                              </span>
                            </div>

                            <div className="relative">
                              <input
                                id={`meas-${spec.key}`}
                                type="number"
                                step="0.25"
                                value={measurements[spec.key] || ""}
                                onFocus={() =>
                                  setActiveMeasurementKey(spec.key)
                                }
                                onChange={(e) =>
                                  handleMeasurementChange(
                                    spec.key,
                                    e.target.value
                                  )
                                }
                                placeholder={`e.g. ${
                                  unit === "inches"
                                    ? spec.placeholderIn
                                    : spec.placeholderCm
                                }`}
                                className={`w-full px-4 py-3 pr-14 bg-[#F8F5EF] border font-mono text-sm text-[#292725] focus:outline-none transition-colors ${
                                  isFocused
                                    ? "border-[#7A1F3D] ring-1 ring-[#7A1F3D]"
                                    : "border-[#E5DEC9]"
                                }`}
                              />
                              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-[#6E6A64]">
                                {unit}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Quick Next Group Navigation inside the Measurement Box */}
                  <div className="flex flex-col items-start gap-2 border-t border-[#E5DEC9] pt-4 text-xs sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-[#6E6A64]">
                      Completed{" "}
                      {
                        requiredSpecs.filter((s) =>
                          Boolean(measurements[s.key]?.trim())
                        ).length
                      }{" "}
                      of {requiredSpecs.length} required measurements
                    </span>
                    {measurementSection === "upper" && (
                      <button
                        type="button"
                        onClick={() => setMeasurementSection("arm")}
                        className="text-[#7A1F3D] uppercase tracking-[0.14em] font-medium hover:underline"
                      >
                        Next: Sleeve &amp; Arm →
                      </button>
                    )}
                    {measurementSection === "arm" && (
                      <button
                        type="button"
                        onClick={() => setMeasurementSection("lower")}
                        className="text-[#7A1F3D] uppercase tracking-[0.14em] font-medium hover:underline"
                      >
                        Next: Length &amp; Trouser →
                      </button>
                    )}
                  </div>
                </div>

                {/* Neckline Style, Reference Image Upload & Special Tailoring Notes */}
                <div className="bg-white border border-[#E5DEC9] p-6 sm:p-8 space-y-5">
                  <h3 className="font-serif text-2xl text-[#292725]">
                    Neck Design, Reference Image &amp; Notes
                  </h3>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs uppercase tracking-[0.14em] text-[#292725]">
                        Neck Design / Style
                      </label>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[#EFECE4] text-[#6E6A64]">
                        Optional
                      </span>
                    </div>
                    <input
                      type="text"
                      value={measurements.neckStyle || ""}
                      onChange={(e) =>
                        handleMeasurementChange("neckStyle", e.target.value)
                      }
                      placeholder="e.g., Boat neck, Sweetheart front with keyhole back, Mandarin collar..."
                      className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] text-sm text-[#292725] focus:outline-none focus:border-[#7A1F3D]"
                    />
                  </div>

                  {/* Reference Image Upload */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs uppercase tracking-[0.14em] text-[#292725]">
                        Upload Reference Image (Neckline / Sleeve / Cut)
                      </label>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[#EFECE4] text-[#6E6A64]">
                        Optional
                      </span>
                    </div>

                    <label className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border border-dashed border-[#7A1F3D]/50 bg-[#F8F5EF] cursor-pointer hover:border-[#7A1F3D] transition-colors">
                      <div className="flex items-center gap-3">
                        <Upload className="w-5 h-5 text-[#7A1F3D]" />
                        <div>
                          <p className="text-xs font-medium text-[#292725]">
                            {referenceImageName ||
                              "Click to upload a reference sketch or photo"}
                          </p>
                          <p className="text-[11px] text-[#6E6A64]">
                            Supports JPG, PNG, WEBP. Saved to your atelier
                            fitting card.
                          </p>
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReferenceUpload}
                        className="hidden"
                      />
                      <span className="px-3 py-1.5 bg-white border border-[#E5DEC9] text-[11px] uppercase tracking-wider text-[#292725]">
                        Choose File
                      </span>
                    </label>

                    {referenceImageData && (
                      <div className="mt-3 flex items-center gap-3 p-3 bg-[#EFECE4]/60 border border-[#E5DEC9]">
                        <img
                          src={referenceImageData}
                          alt="Uploaded reference"
                          className="w-14 h-14 object-cover border border-[#E5DEC9]"
                        />
                        <div className="text-xs text-[#6E6A64]">
                          <p className="text-[#292725] font-medium">
                            {referenceImageName}
                          </p>
                          <p>
                            Attached to your atelier record. Remember to also
                            attach this photo inside WhatsApp chat after
                            submitting.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Special Notes */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs uppercase tracking-[0.14em] text-[#292725]">
                        Special Tailoring Requirements
                      </label>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 bg-[#EFECE4] text-[#6E6A64]">
                        Optional
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={specialNotes}
                      onChange={(e) => setSpecialNotes(e.target.value)}
                      placeholder="e.g., Please keep sleeves unlined, add a right-side trouser pocket, keep waist slightly relaxed..."
                      className="w-full px-4 py-3 bg-[#F8F5EF] border border-[#E5DEC9] text-sm text-[#292725] focus:outline-none focus:border-[#7A1F3D]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#E5DEC9] pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => goToStep(2)}
                className="inline-flex w-full items-center justify-center gap-2 border border-[#292725] px-6 py-3.5 text-xs uppercase tracking-[0.16em] text-[#292725] sm:w-auto"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Design</span>
              </button>

              <button
                type="button"
                onClick={() => goToStep(4)}
                className="btn-sheen inline-flex w-full items-center justify-center gap-2 bg-[#7A1F3D] px-6 py-4 text-xs uppercase tracking-[0.18em] text-[#F8F5EF] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#61182F] sm:w-auto sm:px-8"
              >
                <span>Continue to Customer Details</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: CUSTOMER INFORMATION */}
        {step === 4 && (
          <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#7A1F3D]">
                Step 4 of 5
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#292725] mt-1">
                Your Contact &amp; Delivery Details
              </h2>
              <p className="text-sm text-[#6E6A64] mt-1">
                Our master tailor will confirm your fabric, cut, and timeline
                directly on WhatsApp.
              </p>
            </div>

            <div className="bg-white border border-[#E5DEC9] p-6 sm:p-8 space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-[0.15em] text-[#292725] mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3.5 bg-[#F8F5EF] border border-[#E5DEC9] text-sm text-[#292725] focus:outline-none focus:border-[#7A1F3D]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.15em] text-[#292725] mb-2">
                  WhatsApp Number *
                </label>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g., +880 1711-223344"
                  className="w-full px-4 py-3.5 bg-[#F8F5EF] border border-[#E5DEC9] text-sm text-[#292725] focus:outline-none focus:border-[#7A1F3D]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.15em] text-[#292725] mb-2">
                  Delivery Address *
                </label>
                <textarea
                  rows={3}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="House, Road, Area, and City for garment delivery"
                  className="w-full px-4 py-3.5 bg-[#F8F5EF] border border-[#E5DEC9] text-sm text-[#292725] focus:outline-none focus:border-[#7A1F3D]"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-[0.15em] text-[#292725] mb-2">
                  Additional Delivery / Event Date Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  placeholder="Let us know if you need the outfit before a specific event date..."
                  className="w-full px-4 py-3.5 bg-[#F8F5EF] border border-[#E5DEC9] text-sm text-[#292725] focus:outline-none focus:border-[#7A1F3D]"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => goToStep(3)}
                className="inline-flex w-full items-center justify-center gap-2 border border-[#292725] px-6 py-3.5 text-xs uppercase tracking-[0.16em] text-[#292725] sm:w-auto"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Measurements</span>
              </button>

              <button
                type="button"
                onClick={() => goToStep(5)}
                className="btn-sheen inline-flex w-full items-center justify-center gap-2 bg-[#7A1F3D] px-6 py-4 text-xs uppercase tracking-[0.18em] text-[#F8F5EF] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#61182F] sm:w-auto sm:px-8"
              >
                <span>Review Bespoke Summary</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & SUBMIT VIA WHATSAPP */}
        {step === 5 && (
          <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[#7A1F3D]">
                Step 5 of 5 &middot; Final Atelier Review
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#292725] mt-1">
                Review Your Custom Tailoring Card
              </h2>
              <p className="text-sm text-[#6E6A64] mt-1">
                Verify your outfit details and measurements below before sending
                your custom order via WhatsApp.
              </p>
            </div>

            {/* Complete Summary Dossier Card */}
            <div className="bg-white border border-[#E5DEC9] p-6 sm:p-10 space-y-8 shadow-xs">
              {/* Outfit & Product Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E5DEC9]">
                <div className="flex items-center gap-4">
                  {selectedProduct && (
                    <img
                      src={
                        selectedProduct.images[0] ||
                        "/images/collection-three-piece.jpg"
                      }
                      alt={selectedProduct.name}
                      className="w-20 h-24 object-cover border border-[#E5DEC9]"
                    />
                  )}
                  <div>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-[#7A1F3D]">
                      {selectedCategory} &middot; {tailoringOption}
                    </span>
                    <h3 className="font-serif text-2xl sm:text-3xl text-[#292725]">
                      {selectedProduct?.name}
                    </h3>
                    <p className="text-xs text-[#6E6A64] mt-1">
                      Preferred Shade: <strong>{selectedColor}</strong>
                    </p>
                  </div>
                </div>

                {selectedProduct && (
                  <div className="sm:text-right">
                    <p className="text-xs uppercase tracking-wider text-[#6E6A64]">
                      Tailored Total
                    </p>
                    <p className="font-serif text-2xl text-[#7A1F3D]">
                      {formatPrice(
                        selectedProduct.price + selectedProduct.stitchingFee
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Measurements Summary Grid */}
              <div>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs uppercase tracking-[0.18em] text-[#292725] font-medium">
                    Body Measurements ({unit === "inches" ? "Inches" : "Centimeters"})
                  </h4>
                  <button
                    type="button"
                    onClick={() => goToStep(3)}
                    className="text-xs text-[#7A1F3D] underline"
                  >
                    Edit Measurements
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {relevantSpecs.map((spec) => {
                    const val = measurements[spec.key];
                    return (
                      <div
                        key={spec.key}
                        className="p-3 bg-[#F8F5EF] border border-[#E5DEC9]"
                      >
                        <p className="text-[10px] uppercase tracking-wider text-[#6E6A64]">
                          {spec.label.replace(" (Optional)", "")}
                        </p>
                        <p className="font-mono text-sm text-[#292725] mt-1">
                          {val ? `${val} ${unit}` : "—"}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {measurements.neckStyle && (
                  <div className="mt-3 p-3 bg-[#F8F5EF] border border-[#E5DEC9] text-xs">
                    <span className="uppercase tracking-wider text-[#6E6A64]">
                      Neck Design / Style:{" "}
                    </span>
                    <span className="text-[#292725] font-medium">
                      {measurements.neckStyle}
                    </span>
                  </div>
                )}
              </div>

              {/* Uploaded Reference Image & Manual WhatsApp Attachment Explanation */}
              <div className="pt-4 border-t border-[#E5DEC9] space-y-3">
                <h4 className="text-xs uppercase tracking-[0.18em] text-[#292725] font-medium">
                  Reference Image &amp; Tailoring Notes
                </h4>
                {referenceImageName ? (
                  <div className="p-4 bg-[#EFECE4]/70 border border-[#7A1F3D]/30 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    {referenceImageData && (
                      <img
                        src={referenceImageData}
                        alt="Reference preview"
                        className="w-16 h-16 object-cover border border-[#E5DEC9]"
                      />
                    )}
                    <div className="space-y-1 text-xs">
                      <p className="font-medium text-[#292725] flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-[#7A1F3D]" />
                        <span>Uploaded Reference: {referenceImageName}</span>
                      </p>
                      <p className="text-[#6E6A64] leading-relaxed">
                        <strong>Important Note for WhatsApp:</strong> Your
                        reference photo has been saved to our atelier dashboard.
                        Because WhatsApp links only prefill text messages, please
                        also attach <strong>{referenceImageName}</strong>{" "}
                        manually inside the WhatsApp chat window once it opens.
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#6E6A64]">
                    No reference image uploaded.
                  </p>
                )}

                {specialNotes && (
                  <p className="text-xs text-[#292725] bg-[#F8F5EF] p-3 border border-[#E5DEC9]">
                    <strong>Special Notes:</strong> {specialNotes}
                  </p>
                )}
              </div>

              {/* Customer Details Summary */}
              <div className="pt-4 border-t border-[#E5DEC9]">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs uppercase tracking-[0.18em] text-[#292725] font-medium">
                    Customer &amp; Delivery Information
                  </h4>
                  <button
                    type="button"
                    onClick={() => goToStep(4)}
                    className="text-xs text-[#7A1F3D] underline"
                  >
                    Edit Details
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#F8F5EF] p-4 border border-[#E5DEC9]">
                  <p>
                    <span className="text-[#6E6A64]">Name:</span>{" "}
                    <strong className="text-[#292725]">{customerName}</strong>
                  </p>
                  <p>
                    <span className="text-[#6E6A64]">WhatsApp:</span>{" "}
                    <strong className="text-[#292725]">{whatsappNumber}</strong>
                  </p>
                  <p className="sm:col-span-2">
                    <span className="text-[#6E6A64]">Delivery Address:</span>{" "}
                    <strong className="text-[#292725]">{deliveryAddress}</strong>
                  </p>
                  {additionalInstructions && (
                    <p className="sm:col-span-2">
                      <span className="text-[#6E6A64]">Instructions:</span>{" "}
                      <span className="text-[#292725]">
                        {additionalInstructions}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Prominent WhatsApp Submit Button */}
              <div className="pt-4">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmitViaWhatsapp}
                  className="w-full py-5 px-8 bg-[#7A1F3D] hover:bg-[#61182F] text-[#F8F5EF] text-xs sm:text-sm uppercase tracking-[0.2em] font-medium btn-sheen transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-3 shadow-md cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>
                    {submitting
                      ? "Preparing Your Fitting Card..."
                      : "Send Custom Order via WhatsApp"}
                  </span>
                </button>
              </div>
            </div>

            {/* Confirmation Instructions After WhatsApp Opens */}
            {submittedRequestNumber && (
              <div className="bg-[#EFECE4] border-2 border-[#4A6B53] p-6 sm:p-8 space-y-4 animate-fade-in">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-[#4A6B53] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#4A6B53] font-medium">
                      Fitting Card Logged &middot; Ref #{submittedRequestNumber}
                    </p>
                    <h3 className="font-serif text-2xl text-[#292725]">
                      WhatsApp Window Opened — Next Steps to Confirm
                    </h3>
                    <p className="text-sm text-[#6E6A64] leading-relaxed">
                      1. Press <strong>Send</strong> inside the WhatsApp chat
                      that just opened to transmit your prefilled measurement
                      card to Reshma&rsquo;s Needle (+
                      {settings.whatsappNumber.replace(/[^0-9]/g, "")}).
                    </p>
                    {referenceImageName && (
                      <p className="text-sm text-[#7A1F3D] font-medium leading-relaxed">
                        2. Please attach your reference image (
                        {referenceImageName}) manually inside the WhatsApp chat
                        so our master tailor can see it alongside your message.
                      </p>
                    )}
                  </div>
                </div>

                <StitchRule charm="scissors" className="text-[#7A1F3D]/50" />

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  {generatedWhatsappUrl && (
                    <a
                      href={generatedWhatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#4A6B53] text-[#F8F5EF] px-5 py-2.5 text-xs uppercase tracking-[0.15em] btn-sheen transition-all duration-300 hover:-translate-y-0.5"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Open WhatsApp Again</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedMessageText);
                      showToast("Copied formatted order message to clipboard");
                    }}
                    className="inline-flex items-center gap-2 bg-white border border-[#292725] text-[#292725] px-5 py-2.5 text-xs uppercase tracking-[0.15em]"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Message Text</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-start">
              <button
                type="button"
                onClick={() => goToStep(4)}
                className="inline-flex w-full items-center justify-center gap-2 border border-[#292725] px-6 py-3.5 text-xs uppercase tracking-[0.16em] text-[#292725] sm:w-auto"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous Step</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CustomizePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ivory-rich flex items-center justify-center">
          <p className="font-serif text-2xl text-[#6E6A64]">
            Preparing bespoke tailoring studio...
          </p>
        </div>
      }
    >
      <CustomizeWizardContent />
    </Suspense>
  );
}
