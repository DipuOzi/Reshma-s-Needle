"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export function AdminLogin() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code.trim()) {
      setError("Please enter the atelier access code.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Access denied.");
        setCode("");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[78vh] items-center justify-center bg-[#F8F5EF] px-5 py-16">
      <div className="w-full max-w-md border border-[#E5DEC9] bg-white p-8 shadow-[0_12px_40px_rgba(41,39,37,0.06)] sm:p-10">
        <div className="flex justify-center">
          <BrandLogo size="sm" href="" />
        </div>

        <div className="mt-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#E5DEC9] text-[#7A1F3D]">
            <Lock className="h-5 w-5 stroke-[1.5]" />
          </div>
          <h1 className="mt-4 font-serif text-3xl text-[#292725]">
            Atelier Admin
          </h1>
          <p className="mt-1 text-sm text-[#6E6A64]">
            Enter your access code to manage the boutique.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
          <div>
            <label
              htmlFor="admin-code"
              className="mb-1.5 block text-xs uppercase tracking-[0.15em] text-[#292725]"
            >
              Access Code
            </label>
            <div className="relative">
              <input
                id="admin-code"
                type={showCode ? "text" : "password"}
                autoComplete="current-password"
                autoFocus
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  setError(null);
                }}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "admin-code-error" : undefined}
                className="w-full border border-[#E5DEC9] bg-[#F8F5EF] py-3.5 pl-4 pr-12 font-mono text-sm tracking-[0.2em] text-[#292725] outline-none focus:border-[#7A1F3D]"
              />
              <button
                type="button"
                onClick={() => setShowCode((value) => !value)}
                aria-label={showCode ? "Hide access code" : "Show access code"}
                className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-[#6E6A64] hover:text-[#7A1F3D]"
              >
                {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && (
              <p id="admin-code-error" role="alert" className="mt-2 text-xs text-[#9E3B3B]">
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 bg-[#7A1F3D] py-4 text-xs uppercase tracking-[0.18em] text-[#F8F5EF] transition-colors hover:bg-[#61182F] disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{submitting ? "Verifying..." : "Enter Dashboard"}</span>
          </button>
        </form>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-[#6E6A64]">
          Sessions stay active for 12 hours on this device. After 5 incorrect
          attempts, access is paused for 15 minutes.
        </p>
      </div>
    </div>
  );
}
