"use client";

import { Link } from "@/i18n/navigation";
import RequireLogin from "@/components/account/RequireLogin";
import { card, EmptyState, formatDate, PageHeading, Skeleton } from "@/components/account/ui";
import { errorMessage } from "@/lib/api/client";
import { cancelReturn, getReturns, type ReturnRequest } from "@/lib/services/support.service";
import { AlertTriangle, MessageSquareText, Package, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { formatQuantity } from "@/lib/format";

const TONE: Record<string, string> = {
  REQUESTED: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  APPROVED: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  REJECTED: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
  PICKED_UP: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  RECEIVED: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  REFUNDED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  REPLACED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

function Returns() {
  const t = useTranslations("Returns");
  const word = (code: string) => (t.has(code as never) ? t(code as never) : code.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase()));
  const [rows, setRows] = useState<ReturnRequest[] | null>(null);
  const [error, setError] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);
  const load = useCallback(() => {
    getReturns().then(setRows).catch(() => setError(true));
  }, []);
  useEffect(load, [load]);

  async function cancel(id: string) {
    try {
      await cancelReturn(id);
      toast.success(t("cancelled"));
      setConfirm(null);
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <>
      <PageHeading
        title={t("titleLead")}
        accent={t("titleAccent")}
        subtitle={t.rich("howTo", { link: (c) => <Link href="/orders" className="font-bold text-accent-text hover:underline">{c}</Link> })}
      />
      {error ? (
        <div className={`${card} flex items-center gap-3 p-5 text-sm font-medium text-destructive`} role="alert">
          <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          {t("loadFailed")}
        </div>
      ) : rows === null ? (
        <div className="space-y-4">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={RotateCcw} title={t("emptyTitle")} text={t("emptyText")} action={{ href: "/orders", label: t("goOrders") }} />
      ) : (
        <ul className="space-y-4">
          {rows.map((r) => (
            <li key={r.id} className={`${card} overflow-hidden`}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/50 px-4 py-3 sm:px-5">
                <div>
                  <p className="font-mono text-sm font-bold text-foreground">{t("order", { number: r.order?.orderNumber ?? "" })}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("requested", { date: formatDate(r.requestedAt), reason: word(r.reason) })}
                  </p>
                </div>
                <span className={`rounded border px-2.5 py-1 text-[11px] font-bold ${TONE[r.status] ?? "border-border bg-secondary text-foreground"}`}>{word(r.status)}</span>
              </div>
              <div className="p-4 sm:p-5">
                <ul className="space-y-1.5">
                  {r.items.map((i) => (
                    <li key={i.id} className="flex items-center gap-2.5 text-sm text-foreground">
                      <Package className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{i.orderItem?.productName ?? t("item")}</span>
                      <span className="font-semibold text-muted-foreground">× {formatQuantity(i.quantity)}</span>
                    </li>
                  ))}
                </ul>
                {r.adminNote && (
                  <p className="mt-4 flex items-start gap-2 rounded border border-border bg-background px-3 py-2.5 text-sm text-foreground/85">
                    <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-accent-text" aria-hidden="true" />
                    <span>
                      {t.rich("note", { note: r.adminNote, b: (c) => <b>{c}</b> })}
                    </span>
                  </p>
                )}
                {r.status === "REQUESTED" && (
                  <div className="mt-4 flex justify-end">
                    {confirm === r.id ? (
                      <span className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-foreground">{t("cancelAsk")}</span>
                        <button type="button" onClick={() => cancel(r.id)} className="rounded bg-red-600 px-3 py-1.5 text-xs font-bold text-white">
                          {t("cancelYes")}
                        </button>
                        <button type="button" onClick={() => setConfirm(null)} className="rounded px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary">
                          {t("keep")}
                        </button>
                      </span>
                    ) : (
                      <button type="button" onClick={() => setConfirm(r.id)} className="text-sm font-bold text-red-700 hover:underline dark:text-red-300">
                        {t("cancelRequest")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function ReturnsPage() {
  return (
    <RequireLogin>
      <Returns />
    </RequireLogin>
  );
}
