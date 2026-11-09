"use client";

import React from "react";
import { Check, ChevronLeft, ChevronRight, Info } from "lucide-react";

// The points and paths use the same 864 x 1152 coordinate system as the
// front-facing atelier mannequin artwork. Keeping them together makes the
// fitting guide accurate at every responsive image size.
export interface MeasurementFieldSpec {
  key: string;
  label: string;
  group: "upper" | "arm" | "lower" | "style";
  required: boolean;
  placeholderIn: string;
  placeholderCm: string;
  guideTitle: string;
  guideDescription: string;
  hotspotX: number;
  hotspotY: number;
  /** Front (visible) tape path, in the 864 x 1152 artwork coordinate space. */
  guidePath: string;
  /** Optional back half of a circumference, drawn faint to read as a wrap. */
  wrapBack?: string;
  /** Linear measurements show start / end caps. */
  caps?: [number, number, number, number];
  categories: Array<"Three Piece" | "Two Piece" | "Tops">;
}

const ALL: Array<"Three Piece" | "Two Piece" | "Tops"> = ["Three Piece", "Two Piece", "Tops"];
const BOTTOMS: Array<"Three Piece" | "Two Piece" | "Tops"> = ["Three Piece", "Two Piece"];

export const MEASUREMENT_SPECS: MeasurementFieldSpec[] = [
  {
    key: "shoulder", label: "Shoulder Width", group: "upper", required: true,
    placeholderIn: "14.5", placeholderCm: "37",
    guideTitle: "Shoulder (Bone to Bone)",
    guideDescription: "Measure across your upper back from one shoulder bone to the other, following your natural shoulder line.",
    hotspotX: 432, hotspotY: 221,
    guidePath: "M 334 233 Q 432 211 530 233",
    caps: [334, 233, 530, 233], categories: ALL,
  },
  {
    key: "bust", label: "Bust / Chest", group: "upper", required: true,
    placeholderIn: "36", placeholderCm: "91.5",
    guideTitle: "Full Bust / Chest Circumference",
    guideDescription: "Wrap the tape around the fullest part of your bust. Keep it level with the floor and comfortably close, without pulling tight.",
    hotspotX: 516, hotspotY: 314,
    guidePath: "M 350 312 Q 432 340 514 312",
    wrapBack: "M 350 312 Q 432 290 514 312", categories: ALL,
  },
  {
    key: "waist", label: "Natural Waist", group: "upper", required: true,
    placeholderIn: "30", placeholderCm: "76",
    guideTitle: "Natural Waistline",
    guideDescription: "Find the narrowest part of your torso, usually just above your belly button. Measure while standing naturally and breathing normally.",
    hotspotX: 381, hotspotY: 432,
    guidePath: "M 381 430 Q 432 450 484 430",
    wrapBack: "M 381 430 Q 432 414 484 430", categories: ALL,
  },
  {
    key: "hip", label: "Hip", group: "upper", required: true,
    placeholderIn: "39", placeholderCm: "99",
    guideTitle: "Full Hip Circumference",
    guideDescription: "Measure around the fullest part of your hips and seat, keeping the tape parallel to the floor.",
    hotspotX: 528, hotspotY: 543,
    guidePath: "M 336 541 Q 432 566 528 541",
    wrapBack: "M 336 541 Q 432 520 528 541", categories: ALL,
  },
  {
    key: "sleeveLength", label: "Sleeve Length", group: "arm", required: true,
    placeholderIn: "21", placeholderCm: "53",
    guideTitle: "Sleeve Length",
    guideDescription: "Start at the outer shoulder bone and measure down your slightly bent arm to your preferred cuff position.",
    hotspotX: 566, hotspotY: 420,
    guidePath: "M 534 236 Q 556 330 554 420 Q 556 500 566 572",
    caps: [534, 236, 566, 572], categories: ALL,
  },
  {
    key: "armhole", label: "Armhole (Optional)", group: "arm", required: false,
    placeholderIn: "16.5", placeholderCm: "42",
    guideTitle: "Armhole Loop",
    guideDescription: "Loop the tape from the top of your shoulder down and under your armpit. Leave one finger of space for comfortable movement.",
    hotspotX: 318, hotspotY: 272,
    guidePath: "M 336 232 C 312 240 312 300 338 310",
    wrapBack: "M 338 310 C 366 300 362 240 336 232", categories: ALL,
  },
  {
    key: "upperArm", label: "Upper Arm / Bicep (Optional)", group: "arm", required: false,
    placeholderIn: "12", placeholderCm: "30.5",
    guideTitle: "Upper Arm Circumference",
    guideDescription: "Measure around the fullest part of your upper arm, with the arm relaxed at your side.",
    hotspotX: 297, hotspotY: 340,
    guidePath: "M 300 336 Q 324 348 349 336",
    wrapBack: "M 300 336 Q 324 326 349 336", categories: ALL,
  },
  {
    key: "kameezLength", label: "Kameez / Top Length", group: "lower", required: true,
    placeholderIn: "44", placeholderCm: "112",
    guideTitle: "Garment Length (Shoulder to Hem)",
    guideDescription: "Measure from the highest point of your shoulder, over your bust, straight down to where you want your top or kameez hem to finish.",
    hotspotX: 398, hotspotY: 785,
    guidePath: "M 402 216 Q 392 300 396 420 L 398 785",
    caps: [402, 216, 398, 785], categories: ALL,
  },
  {
    key: "trouserLength", label: "Trouser Length", group: "lower", required: true,
    placeholderIn: "38", placeholderCm: "96.5",
    guideTitle: "Trouser Outseam Length",
    guideDescription: "Measure along the outside of your leg from your preferred waistband position to the ankle or desired hem.",
    hotspotX: 516, hotspotY: 800,
    guidePath: "M 506 480 Q 528 560 518 700 Q 510 880 496 1052",
    caps: [506, 480, 496, 1052], categories: BOTTOMS,
  },
  {
    key: "trouserWaist", label: "Trouser Waist (Optional)", group: "lower", required: false,
    placeholderIn: "31", placeholderCm: "79",
    guideTitle: "Trouser Waistband Position",
    guideDescription: "Measure around the exact height where you prefer the trouser waistband to sit.",
    hotspotX: 366, hotspotY: 482,
    guidePath: "M 368 480 Q 432 500 498 480",
    wrapBack: "M 368 480 Q 432 464 498 480", categories: BOTTOMS,
  },
  {
    key: "trouserHip", label: "Trouser Hip (Optional)", group: "lower", required: false,
    placeholderIn: "40", placeholderCm: "101.5",
    guideTitle: "Trouser Hip Ease",
    guideDescription: "Measure around the lower hip and seat, just above the top of the thighs, so tailored trousers are comfortable when sitting.",
    hotspotX: 336, hotspotY: 578,
    guidePath: "M 338 576 Q 432 598 526 576",
    wrapBack: "M 338 576 Q 432 558 526 576", categories: BOTTOMS,
  },
];

interface TailoringMannequinProps {
  category: "Three Piece" | "Two Piece" | "Tops";
  activeKey: string;
  onSelectKey: (key: string) => void;
  onValueChange: (key: string, value: string) => void;
  values: Record<string, string>;
  unit: "inches" | "cm";
}

export function TailoringMannequin({
  category,
  activeKey,
  onSelectKey,
  onValueChange,
  values,
  unit,
}: TailoringMannequinProps) {
  const relevantSpecs = MEASUREMENT_SPECS.filter((spec) =>
    spec.categories.includes(category)
  );
  const currentIndex = Math.max(
    0,
    relevantSpecs.findIndex((spec) => spec.key === activeKey)
  );
  const currentSpec = relevantSpecs[currentIndex];
  const filledCount = relevantSpecs.filter((spec) =>
    Boolean(values[spec.key]?.trim())
  ).length;

  const navigate = (direction: -1 | 1) => {
    const nextIndex =
      (currentIndex + direction + relevantSpecs.length) % relevantSpecs.length;
    onSelectKey(relevantSpecs[nextIndex].key);
  };

  return (
    <section
      className="overflow-hidden border border-[#DED6C7] bg-[#F0ECE4] shadow-[0_8px_32px_rgba(41,39,37,0.06)]"
      aria-label="Interactive three-dimensional style tailoring mannequin"
    >
      {/* Atelier fitting model heading */}
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#DED6C7] px-5 py-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7A1F3D]" />
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#7A1F3D]">
              Interactive Fitting Model
            </span>
          </div>
          <h4 className="mt-1 font-serif text-[22px] leading-tight text-[#292725] sm:text-2xl">
            Made to fit you.
          </h4>
          <p className="mt-1 text-[11px] text-[#6E6A64]">
            Tap a point on the mannequin to measure.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className="border border-[#DED6C7] bg-[#F8F5EF] px-2.5 py-1 font-mono text-[10px] uppercase text-[#7A1F3D]">
            {unit === "inches" ? "INCHES" : "CENTIMETERS"}
          </span>
          <span className="font-mono text-[10px] text-[#827B73]">
            {filledCount.toString().padStart(2, "0")} / {relevantSpecs.length} filled
          </span>
        </div>
      </div>

      {/* Photorealistic full-body mannequin and responsive interactive layer */}
      <div className="bg-[#EAE3D7] px-3 sm:px-5">
        <div className="relative mx-auto aspect-[3/4] w-full max-w-[350px] select-none overflow-hidden bg-[#EAE3D7]">
          <img
            src="/images/tailoring-mannequin-3d.jpg"
            alt="Realistic full-length female couture fitting mannequin viewed from the front"
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />

          <div className="pointer-events-none absolute left-3 top-3 z-10 border border-[#F8F5EF]/80 bg-[#F8F5EF]/85 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#7A1F3D] backdrop-blur-sm">
            FRONT VIEW
          </div>

          {/* Measurement-specific tape line accurately follows the form. */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 864 1152"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {currentSpec.wrapBack && (
              <path
                d={currentSpec.wrapBack}
                fill="none"
                stroke="#7A1F3D"
                strokeOpacity="0.38"
                strokeWidth="2.5"
                strokeDasharray="5 7"
                strokeLinecap="round"
              />
            )}
            <path
              d={currentSpec.guidePath}
              fill="none"
              stroke="#F8F5EF"
              strokeOpacity="0.9"
              strokeWidth="11"
              strokeLinecap="round"
            />
            <path
              d={currentSpec.guidePath}
              fill="none"
              stroke="#7A1F3D"
              strokeWidth="4"
              strokeDasharray={currentSpec.caps ? "12 7" : undefined}
              strokeLinecap="round"
            />
            {currentSpec.caps && (
              <>
                <circle cx={currentSpec.caps[0]} cy={currentSpec.caps[1]} r="7" fill="#7A1F3D" stroke="#F8F5EF" strokeWidth="3" />
                <circle cx={currentSpec.caps[2]} cy={currentSpec.caps[3]} r="7" fill="#7A1F3D" stroke="#F8F5EF" strokeWidth="3" />
              </>
            )}
          </svg>

          {/* Accessible 44px touch targets; markers stay correctly aligned at any size. */}
          {relevantSpecs.map((spec, index) => {
            const isSelected = spec.key === currentSpec.key;
            const isFilled = Boolean(values[spec.key]?.trim());
            return (
              <button
                key={spec.key}
                type="button"
                title={spec.guideTitle}
                aria-label={`Show how to measure ${spec.label.replace(" (Optional)", "")}`}
                aria-pressed={isSelected}
                onClick={() => onSelectKey(spec.key)}
                style={{
                  left: `${(spec.hotspotX / 864) * 100}%`,
                  top: `${(spec.hotspotY / 1152) * 100}%`,
                }}
                className={`group absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[#7A1F3D] ${isSelected ? "z-20" : "z-10"}`}
              >
                {isSelected && (
                  <span className="absolute h-7 w-7 animate-ping rounded-full bg-[#7A1F3D]/25" />
                )}
                <span
                  className={`relative flex items-center justify-center rounded-full border font-mono leading-none shadow-[0_1px_6px_rgba(41,39,37,0.25)] transition-all duration-200 group-hover:scale-110 ${
                    isSelected
                      ? "h-6 w-6 border-2 border-[#F8F5EF] bg-[#7A1F3D] text-[10px] text-white"
                      : isFilled
                        ? "h-[18px] w-[18px] border-[#F8F5EF] bg-[#617566] text-[8px] text-white"
                        : "h-[18px] w-[18px] border-[#7A1F3D]/70 bg-[#F8F5EF] text-[8px] text-[#7A1F3D]"
                  }`}
                >
                  {isFilled && !isSelected ? (
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  ) : (
                    index + 1
                  )}
                </span>
              </button>
            );
          })}

          {/* Callout label beside the active point */}
          <div
            className="pointer-events-none absolute z-30 hidden -translate-y-1/2 whitespace-nowrap border border-[#7A1F3D]/20 bg-[#F8F5EF]/95 px-2 py-1 shadow-sm backdrop-blur-sm sm:block"
            style={
              currentSpec.hotspotX >= 432
                ? { left: `calc(${(currentSpec.hotspotX / 864) * 100}% + 16px)`, top: `${(currentSpec.hotspotY / 1152) * 100}%` }
                : { right: `calc(${100 - (currentSpec.hotspotX / 864) * 100}% + 16px)`, top: `${(currentSpec.hotspotY / 1152) * 100}%` }
            }
          >
            <p className="text-[9px] uppercase tracking-[0.12em] text-[#7A1F3D]">
              {currentSpec.label.replace(" (Optional)", "").replace(" / Bicep", "")}
            </p>
            <p className="font-mono text-[11px] text-[#292725]">
              {values[currentSpec.key] ? `${values[currentSpec.key]} ${unit === "inches" ? "in" : "cm"}` : "—"}
            </p>
          </div>

          <div className="pointer-events-none absolute bottom-3 left-3 z-10 border border-[#F8F5EF]/70 bg-[#F8F5EF]/80 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.11em] text-[#827B73] backdrop-blur-sm">
            {category} fitting / {relevantSpecs.length} points
          </div>
        </div>
      </div>

      {/* Selection guidance with a direct-entry input: comfortable on phones. */}
      <div className="border-t border-[#DED6C7] bg-[#F8F5EF] px-5 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-medium uppercase tracking-[0.17em] text-[#7A1F3D]">
            Point {(currentIndex + 1).toString().padStart(2, "0")} /{" "}
            {relevantSpecs.length.toString().padStart(2, "0")}
          </span>
          {values[currentSpec.key] && (
            <span className="font-mono text-[11px] text-[#617566]">
              {values[currentSpec.key]} {unit === "inches" ? "in" : "cm"}
            </span>
          )}
        </div>
        <h5 className="mt-1 flex items-center gap-1.5 font-serif text-[22px] leading-tight text-[#292725]">
          <Info className="h-4 w-4 shrink-0 stroke-[1.5] text-[#7A1F3D]" />
          {currentSpec.guideTitle}
        </h5>
        <p className="mt-1.5 text-xs leading-relaxed text-[#6E6A64]">
          {currentSpec.guideDescription}
        </p>

        <div className="mt-3 flex items-end justify-between gap-3 border-t border-[#E5DEC9] pt-3">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="mannequin-active-measurement"
              className="mb-1 block text-[10px] font-medium uppercase tracking-[0.13em] text-[#292725]"
            >
              Enter {currentSpec.label.replace(" (Optional)", "")}{" "}
              {!currentSpec.required && (
                <span className="font-normal normal-case tracking-normal text-[#827B73]">
                  (optional)
                </span>
              )}
            </label>
            <div className="relative max-w-[190px]">
              <input
                id="mannequin-active-measurement"
                key={currentSpec.key}
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={values[currentSpec.key] || ""}
                onChange={(event) =>
                  onValueChange(currentSpec.key, event.target.value)
                }
                placeholder={
                  unit === "inches"
                    ? `e.g. ${currentSpec.placeholderIn}`
                    : `e.g. ${currentSpec.placeholderCm}`
                }
                className="w-full border border-[#D5CBBC] bg-white py-2 pl-3 pr-11 font-mono text-sm text-[#292725] outline-none transition-colors placeholder:text-[#B4A99C] focus:border-[#7A1F3D]"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#827B73]">
                {unit === "inches" ? "in" : "cm"}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 pb-px">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Previous measurement point"
              className="flex h-10 w-10 items-center justify-center border border-[#D5CBBC] text-[#292725] transition-colors hover:border-[#7A1F3D] hover:text-[#7A1F3D] focus-visible:outline-[#7A1F3D]"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate(1)}
              aria-label="Next measurement point"
              className="flex h-10 w-10 items-center justify-center bg-[#7A1F3D] text-white transition-colors hover:bg-[#61182F] focus-visible:outline-[#7A1F3D]"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
