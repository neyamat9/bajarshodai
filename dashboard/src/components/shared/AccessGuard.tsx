import type { ReactNode } from "react";
import { Link, Navigate } from "react-router";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/button";
import { can, canDeliver, isAdminRole, type Permission } from "@/lib/access";
import { useHomePath } from "@/hooks/useHomePath";

/** Shows the page only to people who may open it; everyone else gets a clear message. */
export function Guard({ needs, rider, adminOnly, children }: { needs?: Permission[]; rider?: boolean; adminOnly?: boolean; children: ReactNode }) {
  const user = useAuth((s) => s.user);
  const home = useHomePath();
  const ok = adminOnly ? isAdminRole(user) : rider ? canDeliver(user) : needs ? can(user, ...needs) : true;
  if (ok) return <>{children}</>;
  return (
    <div className="mx-auto mt-16 max-w-md rounded border border-border bg-card p-8 text-center">
      <ShieldAlert className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="mt-3 font-heading text-lg font-bold">You do not have access to this page</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">Ask the shop owner to allow it in Staff, if you need it.</p>
      <Button asChild className="mt-4"><Link to={home}>Go to my page</Link></Button>
    </div>
  );
}

/** "/" is the dashboard: people who may not see it go to their own first page instead. */
export function HomeGate({ children }: { children: ReactNode }) {
  const user = useAuth((s) => s.user);
  const home = useHomePath();
  if (can(user, "reports.view")) return <>{children}</>;
  return <Navigate to={home} replace />;
}
