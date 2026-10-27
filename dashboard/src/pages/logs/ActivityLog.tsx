import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Globe,
  User,
  Shield,
  Bot,
  Layers,
  ChevronRight,
} from "lucide-react";
import { logsApi, type ActivityLog as ActivityLogItem } from "@/api/system";
import { PageHeader } from "@/components/shared/PageHeader";
import { DataTable, type Column } from "@/components/shared/DataTable";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUrlState } from "@/hooks/useUrlState";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import { Select } from "@/components/ui/select";
import { SearchInput } from "@/components/shared/FilterBar";
import { dateTime, num, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { tr } from "@/i18n";

const ACTOR_ICONS: Record<string, React.ReactNode> = {
  ADMIN: <Shield size={14} className="text-fresh-500" />,
  CUSTOMER: <User size={14} className="text-blue-500" />,
  GUEST: <Globe size={14} className="text-muted-foreground" />,
  SYSTEM: <Bot size={14} className="text-emerald-500" />,
};

const ACTION_LABELS: Record<string, string> = {
  // Reports
  "admin.reports.sales.view": "View Sales Reports",
  "admin.reports.orders.view": "View Orders Reports",
  "admin.reports.inventory.view": "View Inventory Reports",
  "admin.reports.customers.view": "View Customers Reports",
  "admin.reports.payments.view": "View Payments Reports",
  "admin.reports.view": "View Reports",

  // Notifications
  "admin.notifications.read.update": "Mark Notifications Read",
  "admin.notifications.view": "View Notifications",
  "admin.notifications.delete": "Clear Notifications",

  // Auth & Account
  "admin.auth.login.create": "Admin Sign In",
  "admin.auth.verify-2fa.create": "Verify Admin 2FA",
  "admin.auth.logout.create": "Admin Sign Out",
  "admin.auth.change-password.create": "Change Password",
  "admin.auth.forgot-password.create": "Request Password Reset",
  "admin.auth.reset-password.create": "Reset Password",
  "admin.auth.me.update": "Update Profile",
  "customer.auth.login.create": "Customer Sign In",
  "customer.auth.register.create": "Customer Registration",
  "customer.auth.logout.create": "Customer Sign Out",

  // Orders & Deliveries
  "customer.orders.create": "Place Order",
  "customer.orders.cancel.create": "Cancel Order",
  "customer.orders.reorder.create": "Reorder Items",
  "admin.orders.status.update": "Update Order Status",
  "admin.orders.assign.update": "Assign Order Delivery",
  "admin.orders.create": "Create Order",
  "admin.orders.update": "Edit Order",
  "admin.orders.delete": "Delete Order",
  "admin.deliveries.status.update": "Update Delivery Status",
  "admin.deliveries.settle.create": "Rider Cash Settlement",

  // Products, Catalog & Inventory
  "admin.products.create": "Create Product",
  "admin.products.update": "Edit Product",
  "admin.products.delete": "Delete Product",
  "admin.inventory.update": "Update Stock",
  "admin.inventory.adjust.create": "Adjust Scale Weight / Stock",
  "admin.categories.create": "Create Category",
  "admin.categories.update": "Update Category",
  "admin.categories.delete": "Delete Category",
  "admin.brands.create": "Create Brand",
  "admin.brands.update": "Update Brand",
  "admin.brands.delete": "Delete Brand",
  "admin.units.create": "Create Unit",
  "admin.units.update": "Update Unit",
  "admin.units.delete": "Delete Unit",

  // Customers & Staff
  "admin.customers.update": "Update Customer",
  "admin.customers.blacklist.update": "Toggle Customer Blacklist",
  "admin.staff.create": "Add Staff Member",
  "admin.staff.update": "Update Staff",
  "admin.staff.delete": "Delete Staff",

  // Settings & System
  "admin.settings.update": "Update Settings",
  "admin.coupons.create": "Create Coupon",
  "admin.coupons.update": "Update Coupon",
  "admin.coupons.delete": "Delete Coupon",
};

export function formatActionLabel(action: string): string {
  if (!action) return "";
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];

  const parts = action.split(".").filter(Boolean);
  if (parts.length === 0) return action;

  // Strip common leading scope if present ('admin', 'customer', 'system', 'api')
  const scope = parts[0];
  const tail = ["admin", "customer", "system", "api"].includes(scope)
    ? parts.slice(1)
    : parts;

  if (tail.length === 0) return action;

  // The last token is typically the verb
  const last = tail[tail.length - 1];
  const verbMap: Record<string, string> = {
    view: "View",
    create: "Create",
    update: "Update",
    delete: "Delete",
    read: "Read",
    cancel: "Cancel",
  };

  const verb = verbMap[last];
  const subjectTokens = verb ? tail.slice(0, -1) : tail;

  const humanize = (s: string) =>
    s
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

  const subject = subjectTokens.map(humanize).join(" ");

  if (verb && subject) {
    return `${verb} ${subject}`;
  }
  return subject || humanize(last) || action;
}

function ActivityDetailModal({
  log,
  onClose,
}: {
  log: ActivityLogItem;
  onClose: () => void;
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold",
                log.success
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {log.success ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              {log.statusCode ?? (log.success ? "200 OK" : tr("Failed"))}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {log.method} {log.path}
            </span>
          </div>
          <DialogTitle className="mt-2 text-base font-bold">
            {formatActionLabel(log.action)}
          </DialogTitle>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {log.action}
            </span>
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {log.category}
            </span>
          </div>
          <DialogDescription className="mt-1">
            {dateTime(log.createdAt)} ({timeAgo(log.createdAt)})
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div className="rounded border border-border bg-card p-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {tr("Summary")}
            </h4>
            <p className="mt-1 text-sm">{log.summary}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div className="rounded border border-border bg-muted/40 p-3 space-y-1.5">
              <p className="font-semibold text-foreground">{tr("Actor")}</p>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                {ACTOR_ICONS[log.actorType]}
                <span className="font-medium text-foreground">{log.actorType}</span>
                {log.actorName && <span>· {log.actorName}</span>}
              </div>
              {log.actorEmail && (
                <p className="text-muted-foreground font-mono text-[11px] truncate">
                  {log.actorEmail}
                </p>
              )}
            </div>

            <div className="rounded border border-border bg-muted/40 p-3 space-y-1.5">
              <p className="font-semibold text-foreground">{tr("Client Details")}</p>
              <p className="text-muted-foreground font-mono">
                IP: {log.ip ?? tr("Unknown")}
              </p>
              <p className="text-muted-foreground">
                Duration: {log.durationMs != null ? `${log.durationMs}ms` : "N/A"}
              </p>
            </div>
          </div>

          {log.errorMessage && (
            <div className="rounded border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <p className="font-semibold">{tr("Error Message")}</p>
              <p className="mt-1 font-mono whitespace-pre-wrap">
                {log.errorMessage}
              </p>
            </div>
          )}

          {log.changes != null && (
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {tr("Changes / Payload")}
              </h4>
              <pre className="custom-scrollbar max-h-60 overflow-auto rounded border border-border bg-muted/80 p-3 font-mono text-[11px] text-foreground">
                {JSON.stringify(log.changes, null, 2)}
              </pre>
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {tr("Close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ActivityLog() {
  const [f, setF] = useUrlState({
    search: "",
    category: "",
    actorType: "",
    success: "",
    page: "1",
  });
  const debouncedSearch = f.search; // SearchInput waits for a pause in typing before it changes the URL
  const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(null);

  const limit = 25;

  const statsQ = useQuery({
    queryKey: ["activity-stats"],
    queryFn: () => logsApi.activityStats({}),
    staleTime: 60_000,
  });

  const q = useInfiniteList(["activity-logs", debouncedSearch, f.category, f.actorType, f.success], (page) =>
    logsApi.activity({
        search: debouncedSearch || undefined,
        category: f.category || undefined,
        actorType: f.actorType || undefined,
        success:
          f.success === "true"
            ? true
            : f.success === "false"
            ? false
            : undefined,
      page,
      limit,
    }),
  );

  const stats = statsQ.data;

  const cols: Column<ActivityLogItem>[] = [
    {
      key: "time",
      header: tr("Timestamp"),
      className: "w-40",
      cell: (r) => (
        <div>
          <p className="text-xs font-medium text-foreground">
            {timeAgo(r.createdAt)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {dateTime(r.createdAt)}
          </p>
        </div>
      ),
    },
    {
      key: "actor",
      header: tr("Actor"),
      className: "w-44",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted">
            {ACTOR_ICONS[r.actorType]}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">
              {r.actorName ?? r.actorType}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {r.actorEmail ?? r.ip ?? "system"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "action",
      header: tr("Action / Category"),
      className: "w-52",
      cell: (r) => (
        <div>
          <p
            className="text-xs font-semibold text-foreground leading-snug"
            title={r.action}
          >
            {formatActionLabel(r.action)}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {r.category}
            </span>
            <span className="text-muted-foreground/30">·</span>
            <span
              className="font-mono text-[10px] text-muted-foreground/70 truncate max-w-[140px]"
              title={r.action}
            >
              {r.action}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "summary",
      header: tr("Summary"),
      cell: (r) => (
        <p className="text-xs text-foreground line-clamp-2">{r.summary}</p>
      ),
    },
    {
      key: "status",
      header: tr("Result"),
      align: "center",
      className: "w-24",
      cell: (r) => (
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold",
            r.success
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-destructive/10 text-destructive"
          )}
        >
          {r.success ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
          {r.statusCode ?? (r.success ? "200" : tr("Fail"))}
        </span>
      ),
    },
    {
      key: "arrow",
      header: "",
      align: "right",
      className: "w-10",
      cell: () => <ChevronRight size={15} className="text-muted-foreground" />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={tr("Activity Log")}
        description={tr("Comprehensive audit of all system events, admin modifications, and customer actions.")}
      />

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StatCard
          label={tr("Total Logged Events")}
          value={stats?.total?.toLocaleString() ?? "—"}
          hint={tr("All recorded activity")}
          icon={<Activity size={18} />}
        />
        <StatCard
          label={tr("Failed Requests")}
          value={stats?.failed?.toLocaleString() ?? "—"}
          hint={tr("HTTP 4xx/5xx or rejected")}
          tone="red"
          icon={<AlertCircle size={18} />}
        />
        <StatCard
          label={tr("Active Categories")}
          value={stats?.byCategory?.length?.toString() ?? "—"}
          hint={tr("System subsystems")}
          tone="sky"
          icon={<Layers size={18} />}
        />
        <StatCard
          label={tr("Top Category")}
          value={stats?.byCategory?.[0]?.category ?? "—"}
          hint={
            stats?.byCategory?.[0]
              ? tr("{{n}} events", { n: num(stats.byCategory[0].count) })
              : tr("No logs yet")
          }
          tone="fresh"
          icon={<Clock size={18} />}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-border bg-card p-3 shadow-xs">
        <div className="flex w-full flex-1 items-center gap-2 sm:min-w-[220px] sm:w-auto">
          <SearchInput value={f.search} onChange={(v) => setF({ search: v })} placeholder={tr("Search actions, emails, summaries...")} className="max-w-none sm:max-w-sm" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={f.actorType}
            onChange={(e) => setF({ actorType: e.target.value })}
            className="h-8 rounded border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">{tr("All Actors")}</option>
            <option value="ADMIN">{tr("Admin")}</option>
            <option value="CUSTOMER">{tr("Customer")}</option>
            <option value="GUEST">{tr("Guest")}</option>
            <option value="SYSTEM">{tr("System")}</option>
          </Select>

          <Select
            value={f.success}
            onChange={(e) => setF({ success: e.target.value })}
            className="h-8 rounded border border-input bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">{tr("All Results")}</option>
            <option value="true">{tr("Success Only")}</option>
            <option value="false">{tr("Failed Only")}</option>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={cols}
        infinite={q}
        empty={{
          title: tr("No activity logs found"),
          description:
            tr("Activity will appear here as users and admins interact with the platform."),
        }}
        onRowClick={(r) => setSelectedLog(r)}
      />

      {/* Detail Dialog */}
      {selectedLog && (
        <ActivityDetailModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
