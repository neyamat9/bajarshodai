"use client";

import { Link } from "@/i18n/navigation";
import RequireLogin from "@/components/account/RequireLogin";
import { card, EmptyState, PageHeading, Skeleton } from "@/components/account/ui";
import { errorMessage } from "@/lib/api/client";
import {
  deleteMyPrescription,
  getMyPrescriptions,
  type Prescription,
  type PrescriptionStatus,
} from "@/lib/services/prescriptions.service";
import {
  AlertTriangle,
  Calendar,
  FileText,
  Phone,
  Trash2,
  X,
  ZoomIn,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocale } from "next-intl";
import type { Locale } from "@/lib/locale";

const STATUS_CONFIG: Record<
  PrescriptionStatus,
  { labelBn: string; labelEn: string; className: string }
> = {
  PENDING: {
    labelBn: "অপেক্ষমান",
    labelEn: "Pending",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  REVIEWED: {
    labelBn: "ফার্মাসিস্ট যাচাই করেছেন",
    labelEn: "Reviewed by Pharmacist",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  ORDER_CREATED: {
    labelBn: "অর্ডার তৈরি হয়েছে",
    labelEn: "Order Created",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  REJECTED: {
    labelBn: "বাতিল",
    labelEn: "Rejected",
    className: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  },
};

function formatPrescriptionTime(isoString: string, locale: Locale): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleString(locale === "bn" ? "bn-BD" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return isoString;
  }
}

function PrescriptionsContent() {
  const locale = useLocale() as Locale;
  const isBn = locale === "bn";

  const [items, setItems] = useState<Prescription[] | null>(null);
  const [error, setError] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const loadData = useCallback(() => {
    getMyPrescriptions()
      .then(setItems)
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDelete(id: string) {
    try {
      setDeletingId(id);
      await deleteMyPrescription(id);
      toast.success(
        isBn ? "প্রেসক্রিপশন সফলভাবে মুছে ফেলা হয়েছে" : "Prescription deleted successfully",
      );
      setConfirmDeleteId(null);
      setItems((prev) => (prev ? prev.filter((item) => item.id !== id) : []));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <PageHeading
        title={isBn ? "আমার" : "My"}
        accent={isBn ? "প্রেসক্রিপশন" : "Prescriptions"}
        subtitle={
          isBn
            ? "আপনার আপলোড করা প্রেসক্রিপশনের তালিকা, অবস্থা ও বিস্তারিত তথ্য।"
            : "List of your uploaded prescriptions, review status and details."
        }
      />

      {error ? (
        <div
          className={`${card} flex items-center gap-3 p-5 text-sm font-medium text-destructive`}
          role="alert"
        >
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          <span>{isBn ? "তথ্য লোড করতে ব্যর্থ হয়েছে" : "Failed to load prescriptions"}</span>
        </div>
      ) : items === null ? (
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={isBn ? "কোনো প্রেসক্রিপশন নেই" : "No prescriptions yet"}
          text={
            isBn
              ? "ওষুধের প্রেসক্রিপশন আপলোড করলে এখানে তার ইতিহাস ও স্ট্যাটাস দেখতে পারবেন।"
              : "Upload a prescription from the medicine page to track order preparation here."
          }
          action={{
            href: "/category/medicine",
            label: isBn ? "ওষুধ বিভাগ দেখুন" : "Browse Medicines",
          }}
        />
      ) : (
        <div className="space-y-4">
          {items.map((rx) => {
            const statusConfig = STATUS_CONFIG[rx.status] || STATUS_CONFIG.PENDING;
            const isPdf = rx.imageUrl.toLowerCase().endsWith(".pdf");

            return (
              <div
                key={rx.id}
                className={`${card} flex flex-col gap-4 p-5 sm:flex-row sm:items-start`}
              >
                {/* Thumbnail / Document preview */}
                <div className="relative shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                  {isPdf ? (
                    <a
                      href={rx.imageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-24 w-24 flex-col items-center justify-center gap-1.5 p-2 text-center text-xs font-semibold text-emerald-600 transition-colors hover:bg-muted/80"
                    >
                      <FileText className="h-8 w-8 text-emerald-600" />
                      <span className="truncate max-w-[80px]">PDF Document</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPreviewImage(rx.imageUrl)}
                      className="group relative flex h-24 w-24 items-center justify-center overflow-hidden"
                      title={isBn ? "বড় করে দেখুন" : "Click to view full size"}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={rx.imageUrl}
                        alt="Prescription"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <ZoomIn className="h-6 w-6 text-white" />
                      </span>
                    </button>
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusConfig.className}`}
                    >
                      {isBn ? statusConfig.labelBn : statusConfig.labelEn}
                    </span>

                    {/* Timestamp */}
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatPrescriptionTime(rx.createdAt, locale)}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{rx.phone}</span>
                  </div>

                  {rx.notes && (
                    <div className="rounded-lg bg-secondary/60 p-2.5 text-xs text-foreground">
                      <span className="font-semibold text-muted-foreground">
                        {isBn ? "আপনার নির্দেশনা: " : "Your note: "}
                      </span>
                      <span>{rx.notes}</span>
                    </div>
                  )}

                  {rx.adminNotes && (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs text-emerald-950 dark:text-emerald-100">
                      <span className="font-semibold">
                        {isBn ? "ফার্মাসিস্টের বার্তা: " : "Pharmacist update: "}
                      </span>
                      <span>{rx.adminNotes}</span>
                    </div>
                  )}
                </div>

                {/* Delete button */}
                <div className="shrink-0 pt-1 sm:pt-0">
                  {confirmDeleteId === rx.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={deletingId === rx.id}
                        onClick={() => handleDelete(rx.id)}
                        className="rounded bg-destructive px-3 py-1.5 text-xs font-bold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {isBn ? "মুছে ফেলুন" : "Confirm"}
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === rx.id}
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
                      >
                        {isBn ? "না" : "Cancel"}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(rx.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
                      title={isBn ? "প্রেসক্রিপশন মুছে ফেলুন" : "Delete prescription"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-2xl bg-black">
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80"
            >
              <X className="h-5 w-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt="Full prescription view"
              className="max-h-[85vh] w-auto max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default function PrescriptionsPage() {
  return (
    <RequireLogin>
      <PrescriptionsContent />
    </RequireLogin>
  );
}
