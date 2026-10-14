import { Link } from "@/i18n/navigation";
import { getSiteSettings } from "@/lib/services/site.service";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Pages" });
  return { title: t("returnsMeta") };
}

export default async function ReturnsPolicyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "Pages" });
  const { returns } = await getSiteSettings();
  const accent = (c: React.ReactNode) => <span className="text-accent-text">{c}</span>;
  const link = (href: string) =>
    function RulesLink(c: React.ReactNode) {
      return (
        <Link href={href} className="font-bold text-accent-text">
          {c}
        </Link>
      );
    };
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-8 text-foreground">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-accent-text">{t("returnsHelp")}</p>
        <h1 className="font-outfit text-4xl font-black tracking-tight">{t.rich("returnsTitle", { accent })}</h1>
        {returns.returnsEnabled ? (
          <>
            <p className="mt-6 text-foreground/80">{t.rich("returnsWindow", { days: returns.returnWindowDays, b: (c) => <b>{c}</b> })}</p>
            {returns.policyText && <div className="mt-6 whitespace-pre-line rounded border border-border bg-muted p-6 text-sm leading-relaxed text-foreground/80">{returns.policyText}</div>}
            <p className="mt-6 text-sm text-muted-foreground">{t.rich("returnsStart", { link: link("/orders") })}</p>
          </>
        ) : (
          <p className="mt-6 text-muted-foreground">{t.rich("returnsOff", { link: link("/contact") })}</p>
        )}
      </div>
    </div>
  );
}
