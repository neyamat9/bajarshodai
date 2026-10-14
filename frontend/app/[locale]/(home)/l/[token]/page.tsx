import ShareLocationPage from "@/components/location/ShareLocationPage";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

// A private link from the shop: never listed in search engines.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ShareLocation" });
  return { title: t("title").replace(/<\/?accent>/g, ""), robots: { index: false, follow: false } };
}

export default async function LocationLink({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  return <ShareLocationPage token={token} />;
}
