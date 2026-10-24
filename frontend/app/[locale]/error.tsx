"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

export default function GlobalErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("ServerError");

  useEffect(() => {
    // Log the error to console for diagnostic purposes
    console.error("App boundary error caught:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto bg-card border border-border rounded-xl p-8 shadow-xl">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
          <AlertTriangle className="h-8 w-8" aria-hidden="true" />
        </div>

        <h1 className="font-outfit text-2xl md:text-3xl font-black text-foreground mb-3">
          {t("title")}
        </h1>

        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          {t("lead")}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-all shadow-md active:scale-95"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            {t("retry")}
          </button>

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-6 py-3 text-sm font-bold text-foreground hover:bg-muted transition-all active:scale-95"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            {t("home")}
          </Link>
        </div>
      </div>
    </div>
  );
}
