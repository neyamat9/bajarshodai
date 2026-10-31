import { Sparkles, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { tr } from "@/i18n";

export interface UploadProgressBarProps {
  progress: number;
  label?: string;
  processingLabel?: string;
  size?: "sm" | "md";
  className?: string;
}

export function UploadProgressBar({
  progress,
  label,
  processingLabel,
  size = "md",
  className,
}: UploadProgressBarProps) {
  const pct = Math.min(100, Math.max(0, Math.round(progress)));
  const isProcessing = pct >= 100;

  const currentLabel = isProcessing
    ? processingLabel || tr("Processing & optimizing image…")
    : label || tr("Uploading photo…");

  return (
    <div
      className={cn(
        "rounded-lg border border-fresh-500/20 bg-fresh-500/5 p-3 dark:bg-fresh-500/10",
        size === "sm" && "p-2",
        className,
      )}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 font-medium text-foreground">
          {isProcessing ? (
            <Sparkles className="size-3.5 shrink-0 animate-spin text-fresh-600 dark:text-fresh-400" />
          ) : (
            <UploadCloud className="size-3.5 shrink-0 text-fresh-600 dark:text-fresh-400 animate-pulse" />
          )}
          <span className="truncate">{currentLabel}</span>
        </span>
        <span className="font-mono text-xs font-bold text-fresh-600 dark:text-fresh-400 shrink-0">
          {pct}%
        </span>
      </div>

      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-secondary/80 dark:bg-muted",
          size === "sm" ? "h-1.5" : "h-2",
        )}
      >
        <div
          className={cn(
            "h-full rounded-full bg-gradient-to-r from-forest-600 via-forest-500 to-fresh-500 transition-all duration-150 ease-out",
            isProcessing && "animate-pulse",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

