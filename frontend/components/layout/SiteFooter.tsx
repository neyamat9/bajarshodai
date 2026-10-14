import { Link } from "@/i18n/navigation";
import BrandLogo from "@/components/layout/BrandLogo";
import NewsletterForm from "@/components/layout/NewsletterForm";
import SocialIcons from "@/components/layout/SocialIcons";
import RevealGroup from "@/components/motion/RevealGroup";
import type { SiteSettings } from "@/lib/services/site.service";
import type { Category } from "@/lib/types";
import { ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

const headingClass = "mb-5 font-outfit text-lg font-semibold text-white";
const linkClass = "inline-block text-sm text-white/70 transition-all hover:translate-x-1 hover:text-brand-fresh";
const colClass = "lg:border-l lg:border-white/10 lg:pl-7";

export default async function SiteFooter({ settings, categories }: { settings: SiteSettings; categories: Category[] }) {
  const t = await getTranslations("Footer");
  const links = [
    { label: t("allProducts"), href: "/products" },
    { label: t("trackOrder"), href: "/track-order" },
    { label: t("myOrders"), href: "/orders" },
    { label: t("wishlist"), href: "/wishlist" },
    { label: t("myAccount"), href: "/account" },
    ...(settings.returns.returnsEnabled ? [{ label: t("returnPolicy"), href: "/returns-policy" }] : []),
  ];

  return (
    <footer className="relative bg-brand-deep text-white dark:border-t dark:border-border dark:bg-card">
      <RevealGroup>
        {/* subscribe bar: centred exactly on the footer's top edge (no gap above the green) */}
        <div className="relative z-10 h-0">
          <div className="absolute inset-x-0 top-0 mx-auto max-w-xl -translate-y-1/2 px-4">
            <div data-reveal="up">
              <NewsletterForm variant="bar" />
            </div>
          </div>
        </div>

        {/* overflow-hidden: the rows slide up while animating in — they must not stretch the page below the footer */}
        <div className="mx-auto max-w-[1440px] overflow-hidden px-4 pb-8 pt-20 md:px-8">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-0">
            {/* brand */}
            <div data-reveal="up" className="flex flex-col gap-5 sm:col-span-2 lg:col-span-4 lg:pr-8">
              <BrandLogo size="lg" tone="onDark" />
              <p className="max-w-xs text-sm leading-relaxed text-white/65">
                {t("about")}
              </p>
              <Link href="/contact" className="group inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-fresh">
                {t("contact")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>

            <div data-reveal="up" className={`lg:col-span-3 ${colClass}`}>
              <h2 className={headingClass}>{t("shop")}</h2>
              <ul className="space-y-3">
                {categories.slice(0, 7).map((c) => (
                  <li key={c.slug}>
                    <Link href={`/category/${c.slug}`} className={linkClass}>
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div data-reveal="up" className={`lg:col-span-3 ${colClass}`}>
              <h2 className={headingClass}>{t("help")}</h2>
              <ul className="space-y-3">
                {links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className={linkClass}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div data-reveal="up" className={`lg:col-span-2 ${colClass}`}>
              <h2 className={headingClass}>{t("follow")}</h2>
              <SocialIcons settings={settings} variant="list" />
            </div>
          </div>

          {/* static on purpose: at the very bottom of the page it can never reach an on-scroll trigger line */}
          <div
            className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/55 sm:flex-row sm:pr-16"
          >
            <p>{t("rights", { year: new Date().getFullYear() })}</p>
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <li>
                <Link href="/contact" className="text-white/70 transition-colors hover:text-brand-fresh">
                  {t("contactShort")}
                </Link>
              </li>
              {settings.returns.returnsEnabled && (
                <li>
                  <Link href="/returns-policy" className="text-white/70 transition-colors hover:text-brand-fresh">
                    {t("returns")}
                  </Link>
                </li>
              )}
              <li className="text-white/55">
                {t("payWith", { bkash: settings.payment.methods.includes("BKASH") ? t("orBkash") : "" })}
              </li>
            </ul>
          </div>
        </div>
      </RevealGroup>
    </footer>
  );
}
