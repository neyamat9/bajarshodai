import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Copy, KeyRound, Phone, RefreshCw, UserCheck, X } from "lucide-react";
import { toast } from "sonner";
import { passwordResetRequestsApi, customersApi, type PasswordResetRequestRow } from "@/api/users";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { FilterBar, FilterSelect } from "@/components/shared/FilterBar";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/shared/Field";
import { useAct } from "@/hooks/useAct";
import { useUrlState } from "@/hooks/useUrlState";
import { dateTime } from "@/lib/format";
import { tr } from "@/i18n";

const D = { status: "", page: "1" };

export default function PasswordResetRequests() {
  const [f, setF] = useUrlState(D);
  const q = useQuery({
    queryKey: ["password-reset-requests", f],
    queryFn: () => passwordResetRequestsApi.list({ status: f.status || undefined, page: Number(f.page) || 1, limit: 20 }),
  });

  const [activeReq, setActiveReq] = useState<PasswordResetRequestRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [tempPw, setTempPw] = useState<string | null>(null);

  const updateStatus = useAct(
    (args: { id: string; status: string; notes?: string }) =>
      passwordResetRequestsApi.update(args.id, args.status, args.notes),
    {
      success: tr("Request updated"),
      invalidate: [["password-reset-requests"]],
      onSuccess: () => setActiveReq(null),
    }
  );

  const resetPasswordAct = useAct(
    async () => {
      if (!activeReq?.user) return;
      const res = await customersApi.resetPassword(activeReq.user.id, newPassword.trim() || undefined);
      await passwordResetRequestsApi.update(activeReq.id, "COMPLETED", notes.trim() || undefined);
      return res;
    },
    {
      success: tr("Password reset and request completed"),
      invalidate: [["password-reset-requests"], ["customers"]],
      onSuccess: (res) => {
        const pw = newPassword.trim() || res?.temporaryPassword;
        if (pw) setTempPw(pw);
        setActiveReq(null);
        setNewPassword("");
        setNotes("");
      },
    }
  );

  const cols: Column<PasswordResetRequestRow>[] = [
    {
      key: "user",
      header: tr("Customer"),
      sk: "lines2",
      cell: (r) => (
        <div>
          {r.user ? (
            <Link to={`/customers/${r.user.id}`} className="font-semibold text-primary hover:underline">
              {r.user.name}
            </Link>
          ) : (
            <span className="font-medium text-foreground">{tr("Guest / Phone only")}</span>
          )}
          <p className="text-[11px] text-muted-foreground">{r.user?.email ?? tr("No email")}</p>
        </div>
      ),
    },
    {
      key: "phone",
      header: tr("Phone Number"),
      sk: "text",
      cell: (r) => (
        <a href={`tel:${r.phone}`} className="inline-flex items-center gap-1 font-mono font-medium text-foreground hover:underline">
          <Phone className="size-3 text-muted-foreground" />
          {r.phone}
        </a>
      ),
    },
    {
      key: "status",
      header: tr("Status"),
      sk: "badge",
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "notes",
      header: tr("Admin Notes"),
      sk: "text",
      cell: (r) => <span className="line-clamp-1 text-xs text-muted-foreground">{r.notes || "—"}</span>,
    },
    {
      key: "createdAt",
      header: tr("Requested At"),
      sk: "text",
      cell: (r) => dateTime(r.createdAt),
    },
    {
      key: "actions",
      header: tr("Actions"),
      align: "right",
      cell: (r) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {r.status === "PENDING" && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => updateStatus.mutate({ id: r.id, status: "CONTACTED" })}
              loading={updateStatus.isPending}
            >
              <UserCheck className="size-3" /> {tr("Contacted")}
            </Button>
          )}
          {r.user && r.status !== "COMPLETED" && (
            <Button
              size="xs"
              variant="default"
              onClick={() => {
                setActiveReq(r);
                setNotes(r.notes || "");
                setNewPassword("");
              }}
            >
              <KeyRound className="size-3" /> {tr("Reset Password")}
            </Button>
          )}
          {r.status !== "REJECTED" && r.status !== "COMPLETED" && (
            <Button
              size="xs"
              variant="ghost"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => updateStatus.mutate({ id: r.id, status: "REJECTED" })}
            >
              <X className="size-3" /> {tr("Reject")}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        back={{ to: "/customers", label: tr("Customers") }}
        title={tr("Password Reset Requests")}
        description={tr("Customer password reset requests submitted via phone number.")}
      />

      <DataTable
        rows={q.data?.data}
        loading={q.isLoading}
        columns={cols}
        empty={{ title: tr("No password reset requests") }}
        toolbar={
          <FilterBar>
            <FilterSelect
              value={f.status}
              onChange={(v) => setF({ status: v, page: "1" })}
              all={tr("Any status")}
              options={[
                { value: "PENDING", label: tr("Pending") },
                { value: "CONTACTED", label: tr("Contacted") },
                { value: "COMPLETED", label: tr("Completed") },
                { value: "REJECTED", label: tr("Rejected") },
              ]}
            />
            {f.status && (
              <Button size="sm" variant="ghost" onClick={() => setF({ status: "", page: "1" })}>
                <RefreshCw className="size-3.5" /> {tr("Clear")}
              </Button>
            )}
          </FilterBar>
        }
      />

      {/* Direct Reset Password Dialog */}
      <Dialog open={!!activeReq} onOpenChange={(o) => !o && setActiveReq(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr("Reset Customer Password")}</DialogTitle>
            <DialogDescription>
              {tr("Set a password for")} <b>{activeReq?.user?.name}</b> (phone: {activeReq?.phone}).
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <Field label={tr("New Password (leave empty to generate temporary)")}>
              <Input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={tr("Leave blank for auto-generated password")}
              />
            </Field>
            <Field label={tr("Resolution notes")}>
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={tr("e.g. Identity verified via phone call, communicated new password.")}
              />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setActiveReq(null)}>{tr("Cancel")}</Button>
            <Button loading={resetPasswordAct.isPending} onClick={() => resetPasswordAct.mutate()}>
              {tr("Reset & Complete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show Generated Password Dialog */}
      <Dialog open={!!tempPw} onOpenChange={(o) => !o && setTempPw(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr("New Password Ready")}</DialogTitle>
            <DialogDescription>
              {tr("Communicate this password to the customer by phone.")}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <div className="flex items-center justify-between gap-3 rounded border border-border bg-muted px-4 py-3">
              <span className="font-mono text-xl font-bold tracking-widest">{tempPw}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void navigator.clipboard.writeText(tempPw ?? "");
                  toast.success(tr("Copied"));
                }}
              >
                <Copy className="size-4" /> {tr("Copy")}
              </Button>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setTempPw(null)}>{tr("Done")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
