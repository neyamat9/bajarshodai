"use client";

import { Link } from "@/i18n/navigation";
import RequireLogin, { PageShell, primaryBtn } from "@/components/account/RequireLogin";
import { getTickets, type Ticket } from "@/lib/services/support.service";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { formatDateTime } from "@/lib/format";

const COLOR: Record<string, string> = { OPEN: "text-yellow-300 bg-yellow-400/10", IN_PROGRESS: "text-blue-300 bg-blue-400/10", WAITING_CUSTOMER: "text-orange-300 bg-orange-400/10", RESOLVED: "text-emerald-300 bg-emerald-400/10", CLOSED: "text-muted-foreground bg-muted" };

function List() {
  const t = useTranslations("Support");
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    getTickets().then(setTickets).catch(() => setError(true));
  }, []);

  return (
    <PageShell eyebrow={t("eyebrow")} title={t("title")} accent={t("titleAccent")} back={{ href: "/account", label: t("account") }}>
      <div className="mb-6 flex justify-end">
        <Link href="/account/support/new" className={primaryBtn}>{t("newTicketBtn")}</Link>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-red-300">{t("loadFailed")}</p>
      ) : tickets === null ? (
        <p className="text-sm text-muted-foreground/70">{t("loading")}</p>
      ) : tickets.length === 0 ? (
        <p className="rounded border border-border bg-muted p-8 text-center text-sm text-muted-foreground/70">{t("none")}</p>
      ) : (
        <ul className="space-y-3">
          {tickets.map((tk) => (
            <li key={tk.id}>
              <Link href={`/account/support/${tk.id}`} className="flex items-center justify-between gap-4 rounded border border-border bg-muted p-5 hover:border-brand-fresh/20">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-muted-foreground/70">{tk.ticketNumber}</p>
                  <p className="truncate font-bold text-foreground">{tk.subject}</p>
                  <p className="text-xs text-muted-foreground/70">{t("lastActivity", { date: formatDateTime(tk.lastMessageAt) })}</p>
                </div>
                <span className={`shrink-0 rounded px-3 py-1 text-[10px] font-black uppercase tracking-wider ${COLOR[tk.status] ?? ""}`}>{t.has(tk.status as never) ? t(tk.status as never) : tk.status}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}

export default function SupportPage() {
  return (
    <RequireLogin>
      <List />
    </RequireLogin>
  );
}
