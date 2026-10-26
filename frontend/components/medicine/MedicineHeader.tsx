"use client";

import { useState } from "react";
import {
  Pill,
  ShieldCheck,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  Phone,
  X,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useLocale } from "next-intl";
import type { Locale } from "@/lib/locale";

interface MedicineHeaderProps {
  categoryName: string;
  categoryDescription?: string | null;
}

export default function MedicineHeader({
  categoryName,
  categoryDescription,
}: MedicineHeaderProps) {
  const locale = useLocale() as Locale;
  const isBn = locale === "bn";
  const [rxModalOpen, setRxModalOpen] = useState(false);
  const [rxFile, setRxFile] = useState<File | null>(null);
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitRx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error(isBn ? "আপনার মোবাইল নম্বর দিন" : "Please provide your contact number");
      return;
    }
    if (!rxFile) {
      toast.error(isBn ? "প্রেসক্রিপশনের ছবি আপলোড করুন" : "Please upload a prescription photo");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setRxModalOpen(false);
      setRxFile(null);
      setNotes("");
      toast.success(
        isBn
          ? "প্রেসক্রিপশন সফলভাবে জমা হয়েছে! আমাদের ফার্মাসিস্ট শীঘ্রই কল করবেন।"
          : "Prescription submitted! Our registered pharmacist will contact you shortly.",
      );
    }, 1000);
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-lg">
        {/* Subtle background glow */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 right-40 h-48 w-48 rounded-full bg-emerald-300/10 blur-2xl" />

        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-md">
              <Pill className="h-3.5 w-3.5 text-emerald-200" />
              <span>
                {isBn
                  ? "১০০% আসল ওষুধ · অফিশিয়াল MRP নিশ্চিত"
                  : "100% Authentic Medicines · Official MRP Guaranteed"}
              </span>
            </div>

            <h1 className="font-outfit text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">
              {categoryName}
            </h1>

            <p className="text-sm text-emerald-50/90 leading-relaxed sm:text-base">
              {categoryDescription ||
                (isBn
                  ? "দেশের শীর্ষস্থানীয় ফার্মাসিউটিক্যালস (স্কয়ার, বেক্সিমকো, ইনসেপ্টা, রেনাটা) থেকে সরাসরি সংগৃহীত জেনুইন ওষুধ।"
                  : "Genuine medicines sourced directly from top pharmaceutical manufacturers (Square, Beximco, Incepta, Renata). Factual brand & generic catalog.")}
            </p>

            {/* Quality & Safety Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-medium text-white/90">
              <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 backdrop-blur-sm">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                {isBn ? "ফার্মাসিস্ট ভেরিফাইড" : "Pharmacist Verified"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 backdrop-blur-sm">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                {isBn ? "মেডেক্স লাইভ সিঙ্ক" : "MedEx Live Sync"}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 backdrop-blur-sm">
                <Clock className="h-3.5 w-3.5 text-emerald-300" />
                {isBn ? "দ্রুততম হোম ডেলিভারি" : "Express Home Delivery"}
              </span>
            </div>
          </div>

          {/* Rx Prescription Call-To-Action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setRxModalOpen(true)}
              className="group flex items-center gap-3 rounded-xl border border-white/30 bg-white/95 px-5 py-3.5 text-left text-emerald-950 shadow-md transition-all hover:bg-white hover:shadow-xl active:scale-95"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm transition-transform group-hover:scale-105">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="font-outfit text-sm font-bold flex items-center gap-1">
                  <span>{isBn ? "প্রেসক্রিপশন আপলোড করুন" : "Upload Prescription"}</span>
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                </p>
                <p className="text-xs text-emerald-800/80">
                  {isBn
                    ? "ছবি তুলুন, আমরা ওষুধ প্রস্তুত করব"
                    : "Snap a photo, we'll prepare your order"}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Prescription Upload Modal */}
      {rxModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setRxModalOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-outfit text-lg font-bold text-foreground">
                  {isBn ? "প্রেসক্রিপশন আপলোড" : "Upload Prescription"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isBn
                    ? "আপনার প্রেসক্রিপশনের ছবি আপলোড করুন"
                    : "Attach doctor's prescription photo"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmitRx} className="space-y-4">
              {/* File Upload Box */}
              <div className="relative rounded-xl border-2 border-dashed border-border p-5 text-center transition-colors hover:border-emerald-500/50 hover:bg-muted/30">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setRxFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <div className="flex flex-col items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Upload className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  {rxFile ? (
                    <span className="font-medium text-foreground">{rxFile.name}</span>
                  ) : (
                    <>
                      <span className="font-semibold text-foreground">
                        {isBn ? "ছবি সিলেক্ট করুন" : "Click to select prescription photo"}
                      </span>
                      <span>JPG, PNG or PDF (Max 10MB)</span>
                    </>
                  )}
                </div>
              </div>

              {/* Phone number */}
              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-foreground">
                  {isBn ? "মোবাইল নম্বর" : "Contact Phone Number"} *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017xxxxxxxx"
                    className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Special notes */}
              <div className="space-y-1 text-left">
                <label className="text-xs font-semibold text-foreground">
                  {isBn ? "অতিরিক্ত নির্দেশনা (ঐচ্ছিক)" : "Special Instructions (Optional)"}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    isBn
                      ? "যেমন: কতদিনের ওষুধ লাগবে..."
                      : "e.g. Need 1 month supply..."
                  }
                  className="w-full rounded-lg border border-input bg-background p-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRxModalOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                >
                  {isBn ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSubmitting
                    ? isBn
                      ? "জমা হচ্ছে..."
                      : "Submitting..."
                    : isBn
                      ? "প্রেসক্রিপশন পাঠান"
                      : "Send Prescription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
