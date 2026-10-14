import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bike, Copy, KeyRound, Pencil, Plus, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { staffApi, type Preset, type StaffDetail, type StaffInput, type StaffRow } from "@/api/staff";
import { errorMessage } from "@/api/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { SearchInput } from "@/components/shared/FilterBar";
import { EmptyState, ErrorState } from "@/components/shared/EmptyState";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Field } from "@/components/shared/Field";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox, Input, Select, Switch } from "@/components/ui/input";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAct } from "@/hooks/useAct";
import { useAuth } from "@/store/auth";
import { dateTime, money, timeAgo } from "@/lib/format";
import { isAdminRole } from "@/lib/access";

const ROLE_LABEL: Record<string, string> = { STAFF: "Staff", ADMIN: "Admin", SUPER_ADMIN: "Super admin" };

function PasswordShown({ name, password, onClose }: { name: string; password: string; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Temporary password for {name}</DialogTitle>
          <DialogDescription>Tell it to them in person or by phone. It is shown only now. They can change it from their profile after signing in.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="flex items-center gap-2 rounded border border-border bg-muted px-3 py-2.5">
            <code className="flex-1 select-all font-mono text-lg font-bold tracking-wider">{password}</code>
            <Button variant="outline" size="xs" onClick={() => navigator.clipboard.writeText(password).then(() => toast.success("Copied"), () => toast.error("Copy failed"))}><Copy /> Copy</Button>
          </div>
        </DialogBody>
        <DialogFooter><Button onClick={onClose}>Done</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Add or change a person. Presets fill in the permissions; each one can still be ticked or unticked. */
function StaffDialog({ person, onClose, onPassword }: { person: StaffRow | null; onClose: () => void; onPassword: (name: string, pw: string) => void }) {
  const me = useAuth((s) => s.user);
  const meta = useQuery({ queryKey: ["staff-meta"], queryFn: staffApi.meta, staleTime: 10 * 60_000 });
  const editing = !!person;
  const self = person?.id === me?.id;
  const [f, setF] = useState({
    name: person?.name ?? "",
    phone: person?.phone ?? "",
    email: person?.email ?? "",
    staffTitle: person?.staffTitle ?? "",
    role: (person?.role === "ADMIN" ? "ADMIN" : "STAFF") as "STAFF" | "ADMIN",
    permissions: person?.permissions ?? ([] as string[]),
    canDeliver: person?.canDeliver ?? false,
    password: "",
    useExistingCustomer: false,
  });
  const [err, setErr] = useState<string | null>(null);
  const [needsCustomerTick, setNeedsCustomerTick] = useState(false);
  const readOnlyRole = !!person && person.role === "SUPER_ADMIN";
  const lockAccess = self || readOnlyRole;
  const mayMakeAdmin = me?.role === "SUPER_ADMIN";

  const save = useAct(
    async () => {
      const common: StaffInput = {
        name: f.name.trim(),
        email: f.email.trim() || null,
        staffTitle: f.staffTitle.trim() || null,
        canDeliver: f.canDeliver,
        ...(lockAccess ? {} : { role: f.role, permissions: f.role === "ADMIN" ? [] : f.permissions }),
      };
      if (editing) return { saved: await staffApi.update(person.id, common), temp: undefined as string | undefined };
      const created = await staffApi.create({ ...common, phone: f.phone.trim(), password: f.password || undefined, useExistingCustomer: f.useExistingCustomer || undefined });
      return { saved: created, temp: created.temporaryPassword };
    },
    {
      success: editing ? "Saved" : "Staff member added",
      invalidate: [["staff"]],
      onSuccess: (r) => {
        onClose();
        if (r.temp) onPassword(r.saved.name, r.temp);
      },
      silentError: (e) => {
        const m = errorMessage(e);
        if (/Use the existing customer account/.test(m)) setNeedsCustomerTick(true);
        setErr(m);
        return true;
      },
    },
  );

  const applyPreset = (p: Preset) => setF((s) => ({ ...s, role: p.role, permissions: p.permissions, canDeliver: p.canDeliver, staffTitle: s.staffTitle || (p.key === "admin" ? "" : p.label) }));
  const toggle = (key: string) => setF((s) => ({ ...s, permissions: s.permissions.includes(key) ? s.permissions.filter((k) => k !== key) : [...s.permissions, key] }));

  const submit = () => {
    if (f.name.trim().length < 2) return setErr("Enter the name");
    if (!editing && !/^(\+?88)?01[3-9]\d{8}$/.test(f.phone.replace(/[\s-]/g, ""))) return setErr("Enter a valid Bangladesh mobile number");
    if (f.email.trim() && !/^\S+@\S+\.\S+$/.test(f.email.trim())) return setErr("Enter a valid email, or leave it empty");
    if (f.password && f.password.length < 6) return setErr("The password needs at least 6 characters, or leave it empty to get a temporary one");
    setErr(null);
    save.mutate();
  };

  const groups = [...new Set((meta.data?.permissions ?? []).map((p) => p.group))];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{editing ? `Edit ${person.name}` : "Add staff"}</DialogTitle>
          <DialogDescription>Choose what this person may do. They sign in to the same dashboard with their phone number.</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {err && <p role="alert" className="rounded bg-red-50 px-3 py-2 text-xs font-medium text-destructive dark:bg-red-500/10">{err}</p>}

          {!lockAccess && (
            <div>
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">Start from</p>
              <div className="flex flex-wrap gap-1.5">
                {(meta.data?.presets ?? []).filter((p) => p.key !== "admin" || mayMakeAdmin).map((p) => (
                  <Button key={p.key} type="button" size="xs" variant="outline" onClick={() => applyPreset(p)}>{p.label}</Button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name" required><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Job title" hint="Shown in lists, e.g. Rider, Packer"><Input value={f.staffTitle} onChange={(e) => setF({ ...f, staffTitle: e.target.value })} /></Field>
            <Field label="Phone (sign-in)" required={!editing}><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} disabled={editing} placeholder="01XXXXXXXXX" inputMode="tel" /></Field>
            <Field label="Email" hint="Optional"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            {!editing && (
              <Field label="Password" hint="Leave empty to get a temporary one to give them"><Input type="text" autoComplete="off" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
            )}
          </div>

          {needsCustomerTick && (
            <label className="flex items-start gap-2 rounded border border-amber-300 bg-amber-50 p-3 text-[13px] dark:border-amber-500/40 dark:bg-amber-500/10">
              <Checkbox checked={f.useExistingCustomer} onChange={(e) => setF({ ...f, useExistingCustomer: e.target.checked })} />
              <span><b>Use the existing customer account.</b> This number already belongs to a customer. They keep their orders and become staff; their password is replaced.</span>
            </label>
          )}

          {readOnlyRole ? (
            <p className="rounded bg-muted px-3 py-2 text-[13px] text-muted-foreground">A super admin can do everything. Their access cannot be changed here.</p>
          ) : (
            <>
              {!self && mayMakeAdmin && (
                <Field label="Role">
                  <Select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as "STAFF" | "ADMIN" })} className="max-w-xs">
                    <option value="STAFF">Staff: only what is ticked below</option>
                    <option value="ADMIN">Admin: everything</option>
                  </Select>
                </Field>
              )}
              {self && <p className="rounded bg-muted px-3 py-2 text-[13px] text-muted-foreground">You cannot change your own role or permissions.</p>}

              {f.role === "STAFF" && !self && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground">What they may do</p>
                  {groups.map((g) => (
                    <fieldset key={g} className="rounded border border-border p-3">
                      <legend className="px-1 text-xs font-semibold">{g}</legend>
                      <div className="space-y-1.5">
                        {(meta.data?.permissions ?? []).filter((p) => p.group === g).map((p) => (
                          <label key={p.key} className="flex cursor-pointer items-start gap-2 text-[13px]">
                            <Checkbox checked={f.permissions.includes(p.key)} onChange={() => toggle(p.key)} className="mt-0.5" />
                            <span>{p.label}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
              )}
            </>
          )}

          <label className="flex cursor-pointer items-start justify-between gap-4 rounded border border-border p-3">
            <span>
              <span className="flex items-center gap-1.5 text-[13px] font-medium"><Bike className="size-4" /> Can deliver orders</span>
              <span className="block text-xs text-muted-foreground">They appear in the “give to” list and get the My deliveries screen. Works for any role, an admin can deliver too.</span>
            </span>
            <Switch checked={f.canDeliver} onCheckedChange={(canDeliver) => setF({ ...f, canDeliver })} />
          </label>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button loading={save.isPending} onClick={submit}>{editing ? "Save" : "Add staff member"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailDialog({ id, onClose }: { id: string; onClose: () => void }) {
  const q = useQuery({ queryKey: ["staff", id], queryFn: () => staffApi.get(id) });
  const d: StaffDetail | undefined = q.data;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{d?.name ?? "Staff member"}</DialogTitle>
          <DialogDescription>{d ? `${d.staffTitle ?? ROLE_LABEL[d.role]} · ${d.phone}` : "Loading…"}</DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          {q.isError && <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />}
          {d && (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[["Delivered", String(d.deliveries.delivered)], ["On now", String(d.deliveries.active)], ["Cash held", money(d.cashInHand)], ["Last sign-in", d.lastLoginAt ? timeAgo(d.lastLoginAt) : "never"]].map(([k, v]) => (
                  <div key={k} className="rounded border border-border bg-muted/40 px-3 py-2"><p className="text-[11px] text-muted-foreground">{k}</p><p className="text-[15px] font-semibold">{v}</p></div>
                ))}
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Access</p>
                {isAdminRole(d) ? <Badge variant="brand">Everything</Badge> : d.permissions.length ? <div className="flex flex-wrap gap-1">{d.permissions.map((p) => <Badge key={p} variant="outline">{p}</Badge>)}</div> : <span className="text-[13px] text-muted-foreground">No dashboard pages{d.canDeliver ? " (rider screen only)" : ""}</span>}
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">What they did lately</p>
                  <Link to={`/activity?actorId=${d.id}`} className="text-xs font-medium text-primary hover:underline dark:text-fresh-400" onClick={onClose}>Open in the activity log</Link>
                </div>
                {d.activity.length === 0 ? <p className="text-[13px] text-muted-foreground">Nothing yet.</p> : (
                  <ol className="relative max-h-72 space-y-3 overflow-y-auto border-l border-border pl-5">
                    {d.activity.map((a) => (
                      <li key={a.id} className="relative">
                        <span className={`absolute -left-[25px] top-1 size-2.5 rounded-full ring-4 ring-card ${a.success ? "bg-fresh-500" : "bg-destructive"}`} />
                        <p className="text-[13px]">{a.summary}</p>
                        <p className="text-[11px] text-muted-foreground">{dateTime(a.createdAt)}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </>
          )}
        </DialogBody>
        <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffList() {
  const me = useAuth((s) => s.user);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [edit, setEdit] = useState<StaffRow | "new" | null>(null);
  const [view, setView] = useState<string | null>(null);
  const [toggling, setToggling] = useState<StaffRow | null>(null);
  const [resetting, setResetting] = useState<StaffRow | null>(null);
  const [shown, setShown] = useState<{ name: string; password: string } | null>(null);

  const q = useQuery({ queryKey: ["staff", search, status], queryFn: () => staffApi.list({ search: search || undefined, status: status || undefined }) });
  const toggle = useAct((p: StaffRow) => staffApi.update(p.id, { status: p.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" }), {
    success: (_d, p) => (p.status === "ACTIVE" ? "Deactivated: they can no longer sign in" : "Reactivated"),
    invalidate: [["staff"]],
    onSuccess: () => setToggling(null),
  });
  const reset = useAct((p: StaffRow) => staffApi.resetPassword(p.id).then((r) => ({ name: p.name, password: r.temporaryPassword })), {
    onSuccess: (r) => {
      setResetting(null);
      setShown(r);
    },
  });

  const rows = q.data?.data ?? [];
  // an admin can only be changed by a super admin; nobody changes a super admin here
  const mayEdit = (p: StaffRow) => p.role === "STAFF" || me?.role === "SUPER_ADMIN" || p.id === me?.id;

  return (
    <div>
      <PageHeader
        title="Staff"
        description="Everyone who signs in to this dashboard: what they may do, and who can deliver. Nobody is ever deleted, so their history stays."
        actions={<Button onClick={() => setEdit("new")}><Plus /> Add staff</Button>}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="Search name, phone, email…" className="w-full sm:w-72" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40" aria-label="Status">
          <option value="">Everyone</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Deactivated</option>
        </Select>
      </div>

      {q.isError ? (
        <ErrorState message={errorMessage(q.error)} onRetry={() => q.refetch()} />
      ) : q.isLoading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded border border-border bg-muted" />)}</div>
      ) : rows.length === 0 ? (
        <EmptyState title="No staff found" description="Add the people who work with you: packers, riders, order takers." />
      ) : (
        <div className="grid gap-2.5 lg:grid-cols-2">
          {rows.map((p) => (
            <Card key={p.id} className={`p-3.5 ${p.status !== "ACTIVE" ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <button type="button" onClick={() => setView(p.id)} className="min-w-0 cursor-pointer text-left">
                  <p className="truncate text-[14px] font-semibold hover:text-primary dark:hover:text-fresh-400">{p.name}{p.id === me?.id && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>}</p>
                  <p className="truncate text-xs text-muted-foreground">{p.staffTitle ?? ROLE_LABEL[p.role]} · {p.phone}</p>
                </button>
                <div className="flex shrink-0 flex-wrap justify-end gap-1">
                  <Badge variant={p.role === "STAFF" ? "neutral" : "brand"}>{ROLE_LABEL[p.role]}</Badge>
                  {p.canDeliver && <Badge variant="fresh"><Bike className="mr-0.5 size-3" /> Rider</Badge>}
                  {p.status !== "ACTIVE" && <Badge variant="danger">Deactivated</Badge>}
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {p.role === "STAFF" ? (p.permissions.length ? `${p.permissions.length} permissions` : "No dashboard pages") : (
                  <span className="inline-flex items-center gap-1"><ShieldCheck className="size-3.5" /> Everything</span>
                )}
                {" · "}
                {p.deliveries.delivered} delivered{p.deliveries.active ? `, ${p.deliveries.active} on now` : ""}
                {" · "}
                {p.lastLoginAt ? `signed in ${timeAgo(p.lastLoginAt)}` : "never signed in"}
              </p>
              {mayEdit(p) && p.role !== "SUPER_ADMIN" && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <Button size="xs" variant="outline" onClick={() => setEdit(p)}><Pencil /> Edit</Button>
                  {p.id !== me?.id && <Button size="xs" variant="outline" onClick={() => setResetting(p)}><KeyRound /> Temporary password</Button>}
                  {p.id !== me?.id && (
                    <Button size="xs" variant="outline" onClick={() => setToggling(p)}>{p.status === "ACTIVE" ? <><UserX /> Deactivate</> : <><UserCheck /> Reactivate</>}</Button>
                  )}
                </div>
              )}
              {mayEdit(p) && p.role === "SUPER_ADMIN" && p.id === me?.id && (
                <div className="mt-2.5"><Button size="xs" variant="outline" onClick={() => setEdit(p)}><Pencil /> Edit</Button></div>
              )}
            </Card>
          ))}
        </div>
      )}

      {edit && <StaffDialog person={edit === "new" ? null : edit} onClose={() => setEdit(null)} onPassword={(name, password) => setShown({ name, password })} />}
      {view && <DetailDialog id={view} onClose={() => setView(null)} />}
      {shown && <PasswordShown name={shown.name} password={shown.password} onClose={() => setShown(null)} />}
      <ConfirmDialog
        open={!!toggling}
        onOpenChange={(o) => !o && setToggling(null)}
        title={toggling?.status === "ACTIVE" ? `Deactivate ${toggling.name}?` : `Reactivate ${toggling?.name}?`}
        description={toggling?.status === "ACTIVE" ? "They are signed out now and cannot sign in again until you reactivate them. Their history stays." : "They can sign in again."}
        confirmLabel={toggling?.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
        destructive={toggling?.status === "ACTIVE"}
        loading={toggle.isPending}
        onConfirm={() => toggling && toggle.mutate(toggling)}
      />
      <ConfirmDialog
        open={!!resetting}
        onOpenChange={(o) => !o && setResetting(null)}
        title={`Set a temporary password for ${resetting?.name}?`}
        description="They are signed out everywhere and their old password stops working. You will see the new one once, to tell them."
        confirmLabel="Set temporary password"
        loading={reset.isPending}
        onConfirm={() => resetting && reset.mutate(resetting)}
      />
    </div>
  );
}
