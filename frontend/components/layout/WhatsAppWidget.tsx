"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getSiteSettings } from "@/lib/services/site.service";
import { buildMessengerUrl, sanitizeMessengerUsername } from "@/lib/services/messenger-order";

/**
 * Floating Quick Contact Widgets (WhatsApp & Facebook Messenger).
 * Sits comfortably in the bottom left, clear of cart and scroll-to-top controls,
 * with subtle pulse animations to welcome customers.
 */
export default function WhatsAppWidget() {
  const t = useTranslations("Common");
  const locale = useLocale();
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [messengerUsername, setMessengerUsername] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getSiteSettings()
      .then((s) => {
        if (!alive) return;
        const raw = s?.site?.whatsapp || s?.site?.hotline;
        if (raw) {
          const clean = raw.replace(/\D/g, "");
          const formatted = clean.startsWith("88") ? clean : clean.startsWith("01") ? `88${clean}` : clean;
          setWhatsappNumber(formatted);
        }

        const isMessengerEnabled = s?.site?.messengerEnabled !== false;
        const rawMessenger =
          s?.site?.messenger ||
          (s?.site?.socialLinks?.facebook
            ? sanitizeMessengerUsername(s.site.socialLinks.facebook)
            : null) ||
          "bajarshodai2";

        if (isMessengerEnabled && rawMessenger) {
          setMessengerUsername(sanitizeMessengerUsername(rawMessenger));
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!whatsappNumber && !messengerUsername) return null;

  const defaultMsg =
    locale === "bn"
      ? "আসসালামু আলাইকুম! বাজার সদাই থেকে অর্ডার বা তথ্য সংক্রান্ত সহায়তা চাই।"
      : "Hello! I need assistance with an order on Bazar Shodai.";

  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMsg)}`
    : null;

  const messengerHref = messengerUsername ? buildMessengerUrl(messengerUsername) : null;

  return (
    <div className="fixed bottom-20 left-4 md:bottom-6 md:left-6 z-[1400] flex flex-col gap-2.5 items-center">
      {/* Messenger floating button */}
      {messengerHref && (
        <a
          href={messengerHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={locale === "bn" ? "ফেসবুক মেসেঞ্জারে যোগাযোগ করুন" : "Chat on Facebook Messenger"}
          title={locale === "bn" ? "মেসেঞ্জারে নক দিন" : "Chat on Messenger"}
          className="group relative flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-full bg-[#0084FF] text-white shadow-lg shadow-[#0084FF]/30 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-[#0084FF]/40 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#0084FF]/40"
        >
          <svg className="h-5 w-5 md:h-6 md:w-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2C6.48 2 2 6.16 2 11.29c0 2.92 1.45 5.53 3.73 7.21v3.5l3.35-1.84c.94.26 1.93.41 2.92.41 5.52 0 10-4.16 10-9.28S17.52 2 12 2zm1.03 12.51-2.58-2.75-5.04 2.75 5.54-5.88 2.66 2.75 4.96-2.75-5.54 5.88z" />
          </svg>
        </a>
      )}

      {/* WhatsApp floating button */}
      {whatsappHref && (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("chatWhatsApp") || "Chat with us on WhatsApp"}
          title={locale === "bn" ? "হোয়াটসঅ্যাপে চ্যাট" : "Chat on WhatsApp"}
          className="group relative flex h-11 w-11 md:h-12 md:w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-[#25D366]/40 active:scale-95 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
        >
          <span className="absolute -inset-0.5 -z-10 rounded-full bg-[#25D366] opacity-40 animate-ping group-hover:opacity-0" />
          <svg className="h-5 w-5 md:h-6 md:w-6 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12.031 2C6.495 2 2 6.495 2 12.031c0 1.94.555 3.753 1.517 5.286L2 22l4.81-1.488A9.97 9.97 0 0012.031 22c5.536 0 10.031-4.495 10.031-10.031 0-5.536-4.495-10.031-10.031-10.031zm0 18.25c-1.637 0-3.17-.463-4.48-1.27l-.322-.198-2.852.883.896-2.775-.21-.334a8.167 8.167 0 01-1.282-4.525c0-4.542 3.696-8.238 8.25-8.238 4.543 0 8.239 3.696 8.239 8.238 0 4.542-3.696 8.243-8.22 8.243zm4.516-6.177c-.247-.124-1.464-.722-1.691-.804-.227-.082-.392-.124-.557.124-.165.247-.64 1.133-.784 1.298-.144.165-.288.185-.536.062-.247-.124-1.045-.385-1.99-1.228-.735-.655-1.232-1.465-1.376-1.712-.144-.247-.015-.38.109-.504.111-.111.247-.289.371-.433.124-.144.165-.247.247-.412.082-.165.041-.309-.021-.433-.062-.124-.557-1.34-.763-1.835-.2-.482-.403-.417-.557-.425l-.474-.008c-.165 0-.433.062-.66.309-.227.247-.866.845-.866 2.062 0 1.217.887 2.392 1.01 2.557.124.165 1.745 2.664 4.227 3.737.59.255 1.052.408 1.411.522.593.188 1.133.161 1.56.098.477-.071 1.464-.598 1.67-1.175.206-.577.206-1.072.144-1.175-.062-.103-.227-.165-.474-.289z" />
          </svg>
        </a>
      )}
    </div>
  );
}
