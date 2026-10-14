"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatNumber } from "@/lib/format";
import type { Locale } from "@/lib/locale";

/**
 * StepIndicator — 3-step checkout progress bar
 *
 * Steps: Shipping (1) → Payment (2) → Review (3)
 * - Completed steps: green fill + checkmark icon
 * - Active step: green ring with pulsing animation
 * - Upcoming steps: muted/dimmed
 */

interface Step {
  id: number;
  label: string;
  shortLabel: string;
}

const STEP_KEYS = [
  { id: 1, label: "stepShipping", shortLabel: "stepShippingShort" },
  { id: 2, label: "stepLocation", shortLabel: "stepLocationShort" },
  { id: 3, label: "stepPayment", shortLabel: "stepPaymentShort" },
  { id: 4, label: "stepReview", shortLabel: "stepReviewShort" },
] as const;

interface StepIndicatorProps {
  currentStep: number; // 1 | 2 | 3
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const t = useTranslations("Checkout");
  const locale = useLocale() as Locale;
  const STEPS: Step[] = STEP_KEYS.map((s) => ({ id: s.id, label: t(s.label), shortLabel: t(s.shortLabel) }));
  return (
    <nav aria-label={t("progress")} className="w-full">
      <ol className="flex items-center justify-center gap-0">
        {STEPS.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isActive = step.id === currentStep;
          const isLast = index === STEPS.length - 1;

          return (
            <li key={step.id} className="flex items-center">
              {/* Step node */}
              <div className="flex flex-col items-center gap-2">
                {/* Circle */}
                <div className="relative flex items-center justify-center">
                  {/* Pulsing ring for active step */}
                  {isActive && (
                    <span
                      className="absolute inset-0 rounded border-2 border-brand-fresh animate-ping opacity-40"
                      aria-hidden="true"
                    />
                  )}

                  <div
                    className={[
                      "relative w-10 h-10 rounded flex items-center justify-center font-bold text-sm transition-all duration-300 z-10",
                      isCompleted
                        ? "bg-primary text-white shadow-[0_0_16px_rgba(69,162,44,0.4)]"
                        : isActive
                        ? "bg-brand-fresh/15 border-2 border-brand-fresh text-accent-text shadow-[0_0_20px_rgba(69,162,44,0.25)]"
                        : "bg-muted border-2 border-border text-muted-foreground/70",
                    ].join(" ")}
                    aria-current={isActive ? "step" : undefined}
                  >
                    {isCompleted ? (
                      /* Checkmark icon */
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <span>{formatNumber(step.id, locale, 0)}</span>
                    )}
                  </div>
                </div>

                {/* Label */}
                <span
                  className={[
                    "text-xs font-medium transition-colors duration-300 text-center leading-tight",
                    isCompleted
                      ? "text-accent-text"
                      : isActive
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground/70",
                  ].join(" ")}
                >
                  {/* Show short label on mobile, full label on sm+ */}
                  <span className="sm:hidden">{step.shortLabel}</span>
                  <span className="hidden sm:inline">{step.label}</span>
                </span>
              </div>

              {/* Connector line between steps */}
              {!isLast && (
                <div
                  className={[
                    "h-[2px] w-8 min-[400px]:w-12 sm:w-20 md:w-24 mx-1.5 mb-5 rounded transition-all duration-500",
                    isCompleted
                      ? "bg-brand-fresh shadow-[0_0_8px_rgba(69,162,44,0.4)]"
                      : "bg-secondary",
                  ].join(" ")}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
