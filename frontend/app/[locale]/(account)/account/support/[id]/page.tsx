"use client";

import RequireLogin, { PageShell, inputCls, primaryBtn } from "@/components/account/RequireLogin";
import { errorMessage } from "@/lib/api/client";
import { closeTicket, getTicket, replyTicket, type Ticket } from "@/lib/services/support.service";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { formatDateTime } from "@/lib/format";

function Thread() {
  const tr = useTranslations("Support");
  const { id } = useParams<{ id: string }>();
  const [t, setT] = useState<Ticket | null>(null);
  const [missing, setMissing] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    getTicket(id).then(setT).catch(() => setMissing(true));
  }, [id]);
  useEffect(load, [load]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (msg.trim().length < 2) return;
    setBusy(true);
    try {
      await replyTicket(id, msg.trim());
      setMsg("");
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  async function close() {
    try {
      await closeTicket(id);
      toast.success(tr("closedToast"));
      load();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  if (missing) return <PageShell eyebrow={tr("eyebrowSupport")} title={tr("ticket")} accent={tr("notFound")} back={{ href: "/account/support", label: tr("tickets") }}><p className="text-muted-foreground">{tr("notFoundText")}</p></PageShell>;
  if (!t) return <PageShell eyebrow={tr("eyebrowSupport")} title={tr("loading")} back={{ href: "/account/support", label: tr("tickets") }}><p className="text-muted-foreground/70">{tr("loading")}</p></PageShell>;
  const closed = t.status === "CLOSED";

  return (
    <PageShell eyebrow={t.ticketNumber} title={t.subject} back={{ href: "/account/support", label: tr("tickets") }}>
      <ul className="mb-8 space-y-3">
        {(t.messages ?? []).map((m) => (
          <li key={m.id} className={`flex ${m.isStaff ? "" : "justify-end"}`}>
            <div className={`max-w-[85%] rounded px-4 py-3 text-sm ${m.isStaff ? "bg-muted text-foreground/80" : "bg-brand-fresh/15 text-foreground"}`}>
              <p className="mb-1 text-[11px] text-muted-foreground/70">{m.isStaff ? tr("team") : tr("you")} · {formatDateTime(m.createdAt)}</p>
              <p className="whitespace-pre-wrap">{m.message}</p>
            </div>
          </li>
        ))}
      </ul>
      {closed ? (
        <p className="text-sm text-muted-foreground/70">{tr("closedText")}</p>
      ) : (
        <form onSubmit={send} className="space-y-3">
          <label htmlFor="reply" className="sr-only">{tr("yourReply")}</label>
          <textarea id="reply" rows={4} maxLength={5000} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder={tr("replyPh")} className={inputCls} />
          <div className="flex gap-3">
            <button type="submit" disabled={busy || msg.trim().length < 2} className={primaryBtn}>{busy ? tr("sending") : tr("sendReply")}</button>
            <button type="button" onClick={close} className="rounded border border-border px-5 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground">{tr("closeTicket")}</button>
          </div>
        </form>
      )}
    </PageShell>
  );
}

export default function TicketPage() {
  return (
    <RequireLogin>
      <Thread />
    </RequireLogin>
  );
}
