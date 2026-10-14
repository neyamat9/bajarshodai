import { useAuth } from "@/store/auth";
import { menuFor } from "@/components/layout/menu";

/** The first page this person is allowed to open (where "home" sends people who may not see the dashboard). */
export function useHomePath() {
  const user = useAuth((s) => s.user);
  const first = menuFor(user)
    .flatMap((s) => s.items)
    .find((i) => i.to !== "/" && i.to !== "/profile" && i.to !== "/notifications");
  return first?.to ?? "/profile";
}
