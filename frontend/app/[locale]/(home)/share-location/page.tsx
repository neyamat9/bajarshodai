import ShareLocationPage from "@/components/location/ShareLocationPage";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "ShareLocation" });
  return { title: t("checkTitle").replace(/<\/?accent>/g, "") };
}

export default async function ShareLocation({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ShareLocationPage />;
}
