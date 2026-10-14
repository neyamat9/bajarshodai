import { redirect } from "@/i18n/navigation";

// The thank-you now lives on the order page itself.
export default async function OrderConfirmationPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  redirect({ href: `/orders/${id}?placed=1`, locale });
}
