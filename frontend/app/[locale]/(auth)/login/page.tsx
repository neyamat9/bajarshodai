import { redirect } from "@/i18n/navigation";

// There is no separate page any more: the sign-in modal opens over the storefront.
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; session?: string }>;
}) {
  const { locale } = await params;
  const { next, session } = await searchParams;
  const q = new URLSearchParams({ auth: "login" });
  if (next) q.set("next", next);
  if (session) q.set("session", session);
  redirect({ href: `/?${q.toString()}`, locale });
}
