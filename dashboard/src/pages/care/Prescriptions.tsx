import { useState } from "react";
import { Link } from "react-router";
import {
  FileText,
  Phone,
  Trash2,
  ZoomIn,
  PlusCircle,
  ExternalLink,
  Calendar,
  User,
} from "lucide-react";
import {
  prescriptionsApi,
  type PrescriptionItem,
  type PrescriptionStatus,
} from "@/api/prescriptions";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { FilterBar, FilterSelect, SearchInput } from "@/components/shared/FilterBar";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Field } from "@/components/shared/Field";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAct } from "@/hooks/useAct";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import { useUrlState } from "@/hooks/useUrlState";
import { dateTime } from "@/lib/format";
import { tr } from "@/i18n";

const STATUS_BADGES: Record<
  PrescriptionStatus,
  { label: string; bg: string }
> = {
  PENDING: { label: "Pending (অপেক্ষমান)", bg: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  REVIEWED: { label: "Reviewed (যাচাইকৃত)", bg: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  ORDER_CREATED: { label: "Order Created (অর্ডার প্রস্তুত)", bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  REJECTED: { label: "Rejected (বাতিল)", bg: "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30" },
};

function DetailDialog({
  rx,
  onClose,
}: {
  rx: PrescriptionItem;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<PrescriptionStatus>(rx.status);
  const [adminNotes, setAdminNotes] = useState(rx.adminNotes ?? "");
  const [previewZoom, setPreviewZoom] = useState(false);

  const save = useAct(
    () => prescriptionsApi.updateStatus(rx.id, status, adminNotes.trim() || undefined),
    {
      success: tr("Prescription updated"),
      invalidate: [["prescriptions"], ["attention-summary"]],
      onSuccess: onClose,
    },
  );

  const isPdf = rx.imageUrl.toLowerCase().endsWith(".pdf");

  return (
    <>
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>{tr("Prescription Review")}</DialogTitle>
            <DialogDescription>
              {rx.user ? rx.user.name : "Guest Customer"} · {rx.phone} · {dateTime(rx.createdAt)}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4">
            {/* Prescription Preview Container */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-muted/40 p-3">
              {isPdf ? (
                <a
                  href={rx.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/20"
                >
                  <FileText className="size-5" />
                  <span>{tr("Open Prescription PDF")}</span>
                  <ExternalLink className="size-4" />
                </a>
              ) : (
                <div className="group relative max-h-[380px] overflow-hidden rounded-lg">
                  <img
                    src={rx.imageUrl}
                    alt="Prescription"
                    className="max-h-[380px] w-auto cursor-pointer rounded-lg object-contain shadow-sm transition-transform duration-300 group-hover:scale-105"
                    onClick={() => setPreviewZoom(true)}
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(true)}
                    className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/70 px-2 py-1 text-xs text-white backdrop-blur-sm hover:bg-black/90"
                  >
                    <ZoomIn size={14} />
                    <span>Zoom</span>
                  </button>
                </div>
              )}
            </div>

            {/* Customer Details & Actions */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 rounded-lg border border-border bg-card p-3 text-xs">
                <span className="font-semibold text-muted-foreground">{tr("Contact Phone")}:</span>
                <div className="flex items-center gap-2 pt-0.5">
                  <a
                    href={`tel:${rx.phone}`}
                    className="font-bold text-primary hover:underline flex items-center gap-1 text-sm"
                  >
                    <Phone size={14} />
                    <span>{rx.phone}</span>
                  </a>
                </div>
              </div>

              <div className="space-y-1 rounded-lg border border-border bg-card p-3 text-xs">
                <span className="font-semibold text-muted-foreground">{tr("Customer Notes")}:</span>
                <p className="text-foreground pt-0.5 whitespace-pre-wrap">
                  {rx.notes || "None provided"}
                </p>
              </div>
            </div>

            {/* Status & Pharmacist Internal Note */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label={tr("Status")}>
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PrescriptionStatus)}
                >
                  <option value="PENDING">Pending (অপেক্ষমান)</option>
                  <option value="REVIEWED">Reviewed (যাচাইকৃত)</option>
                  <option value="ORDER_CREATED">Order Created (অর্ডার প্রস্তুত)</option>
                  <option value="REJECTED">Rejected (বাতিল)</option>
                </Select>
              </Field>

              <Field label={tr("Pharmacist / Admin Note")} className="sm:col-span-2">
                <Textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Notes visible to pharmacist & customer (e.g. Napa, Seclo 20mg confirmed)"
                />
              </Field>
            </div>
          </DialogBody>

          <DialogFooter className="flex flex-wrap items-center justify-between gap-2">
            <Link
              to={`/orders/new?phone=${encodeURIComponent(rx.phone)}`}
              className="inline-flex items-center gap-1.5 rounded bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700"
            >
              <PlusCircle size={15} />
              <span>{tr("Create Order for Customer")}</span>
            </Link>

            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={onClose}>
                {tr("Close")}
              </Button>
              <Button loading={save.isPending} onClick={() => save.mutate()}>
                {tr("Save Changes")}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full-Screen Zoom Lightbox */}
      {previewZoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md"
          onClick={() => setPreviewZoom(false)}
        >
          <img
            src={rx.imageUrl}
            alt="Prescription Full Zoom"
            className="max-h-[92vh] max-w-[95vw] rounded-lg object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}

export default function Prescriptions() {
  const [f, setF] = useUrlState({ search: "", status: "", page: "1" });
  const search = f.search;

  const [selected, setSelected] = useState<PrescriptionItem | null>(null);
  const [toDelete, setToDelete] = useState<PrescriptionItem | null>(null);

  const q = useInfiniteList(
    ["prescriptions", search, f.status],
    (page) => prescriptionsApi.list({ search, status: f.status, page, limit: 20 }),
  );

  const remove = useAct(
    () => prescriptionsApi.remove(toDelete!.id),
    {
      success: tr("Prescription deleted"),
      invalidate: [["prescriptions"], ["attention-summary"]],
      onSuccess: () => setToDelete(null),
    },
  );

  const columns: Column<PrescriptionItem>[] = [
    {
      key: "preview",
      header: tr("Prescription"),
      className: "w-20",
      cell: (rx) => (
        <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
          {rx.imageUrl.toLowerCase().endsWith(".pdf") ? (
            <div className="flex h-full w-full items-center justify-center text-emerald-600">
              <FileText size={20} />
            </div>
          ) : (
            <img src={rx.imageUrl} alt="" className="h-full w-full object-cover" />
          )}
        </div>
      ),
    },
    {
      key: "customer",
      header: tr("Customer & Phone"),
      cell: (rx) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">
            {rx.user?.name || "Guest Customer"}
          </p>
          <a
            href={`tel:${rx.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
          >
            <Phone size={12} />
            <span>{rx.phone}</span>
          </a>
        </div>
      ),
    },
    {
      key: "notes",
      header: tr("Customer Note"),
      cell: (rx) => (
        <p className="line-clamp-2 max-w-xs text-xs text-muted-foreground">
          {rx.notes || "—"}
        </p>
      ),
    },
    {
      key: "status",
      header: tr("Status"),
      cell: (rx) => {
        const badge = STATUS_BADGES[rx.status] || STATUS_BADGES.PENDING;
        return (
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.bg}`}>
            {badge.label}
          </span>
        );
      },
    },
    {
      key: "date",
      header: tr("Date"),
      cell: (rx) => (
        <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
          <Calendar size={13} />
          <span>{dateTime(rx.createdAt)}</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-24 text-right",
      cell: (rx) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelected(rx)}
            title={tr("View Details")}
          >
            {tr("Review")}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setToDelete(rx)}
            title={tr("Delete")}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 size={15} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title={tr("Customer Prescriptions (প্রেসক্রিপশন)")}
        subtitle={tr("Review doctor prescriptions uploaded by patients and prepare medicine orders.")}
      />

      <FilterBar>
        <SearchInput
          value={search}
          placeholder={tr("Search by phone, customer or note...")}
          onChange={(s) => setF({ search: s, page: "1" })}
        />
        <FilterSelect
          value={f.status}
          onChange={(status) => setF({ status, page: "1" })}
          options={[
            { value: "", label: tr("All Statuses") },
            { value: "PENDING", label: tr("Pending (অপেক্ষমান)") },
            { value: "REVIEWED", label: tr("Reviewed (যাচাইকৃত)") },
            { value: "ORDER_CREATED", label: tr("Order Created (অর্ডার প্রস্তুত)") },
            { value: "REJECTED", label: tr("Rejected (বাতিল)") },
          ]}
        />
      </FilterBar>

      <DataTable
        columns={columns}
        rows={q.rows}
        loading={q.isLoading}
        onRowClick={(rx) => setSelected(rx)}
        emptyTitle={tr("No prescriptions found")}
        emptySubtitle={tr("When customers upload doctor prescriptions on the medicine page, they appear here.")}
      />

      {selected && <DetailDialog rx={selected} onClose={() => setSelected(null)} />}

      {toDelete && (
        <ConfirmDialog
          open
          onOpenChange={(o) => !o && setToDelete(null)}
          title={tr("Delete prescription")}
          description={tr("Are you sure you want to delete this prescription? This action cannot be undone.")}
          confirmLabel={tr("Delete")}
          destructive
          loading={remove.isPending}
          onConfirm={() => remove.mutate()}
        />
      )}
    </div>
  );
}

