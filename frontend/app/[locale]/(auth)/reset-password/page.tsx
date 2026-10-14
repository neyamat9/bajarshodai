import { redirect } from "@/i18n/navigation";

// The link in the reset email lands here and opens the "choose a new password" modal over the storefront.
export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  redirect({ href: `/?reset=${encodeURIComponent(token ?? "")}`, locale });
}
