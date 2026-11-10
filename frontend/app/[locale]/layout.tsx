import CartSidebar from "@/components/cart/CartSidebar";
import FloatingCart from "@/components/cart/FloatingCart";
import { AuthModalProvider } from "@/components/auth/AuthModal";
import { ProductQuickViewProvider } from "@/components/product/ProductQuickViewModal";
import FreshnessWatcher from "@/components/layout/FreshnessWatcher";
import WhatsAppWidget from "@/components/layout/WhatsAppWidget";
import ScrollToTop from "@/components/motion/ScrollToTop";
import SmoothScroll from "@/components/motion/SmoothScroll";
import ThemeProvider from "@/components/theme/ThemeProvider";
import GoogleProvider from "@/components/providers/GoogleProvider";
import { isLocale, routing } from "@/i18n/routing";
import { AuthProvider } from "@/lib/context/AuthContext";
import { CartProvider } from "@/lib/context/CartContext";
import { WishlistProvider } from "@/lib/context/WishlistContext";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { Toaster } from "sonner";
import "../globals.css";

// Self-hosted fonts (see app/fonts/README.md): completely removes runtime Google Font CDN
// network requests during build and Turbopack deployment, ensuring 100% reliable builds.
const inter = localFont({
  src: "../fonts/Inter-variable.woff2",
  variable: "--font-inter",
  display: "swap",
});

const outfit = localFont({
  src: "../fonts/Outfit-variable.woff2",
  variable: "--font-outfit",
  display: "swap",
});

// Bangla text: Inter and Outfit have no Bangla letters, so the browser falls back to this font for them.
const bangla = localFont({
  src: "../fonts/NotoSansBengali-variable.woff2",
  variable: "--font-bangla",
  weight: "400 800",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale: isLocale(locale) ? locale : routing.defaultLocale, namespace: "Meta" });
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    title: { default: t("title"), template: t("titleTemplate") },
    description: t("description"),
    keywords: t("keywords").split("|"),
    openGraph: {
      siteName: "Bazar Shodai",
      type: "website",
      locale: locale === "en" ? "en_BD" : "bn_BD",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Bazar Shodai" }],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <noscript>
          <style>{"[data-reveal],[data-hero-item]{opacity:1!important}"}</style>
        </noscript>
      </head>
      <body className={`${inter.variable} ${outfit.variable} ${bangla.variable} antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
            <SmoothScroll />
            <ScrollToTop />
            <FreshnessWatcher />
            <GoogleProvider>
              <AuthProvider>
                <CartProvider>
                  <WishlistProvider>
                    <ProductQuickViewProvider>
                      <AuthModalProvider>
                        {children}
                        {/* Global overlays — rendered once, visibility driven by context */}
                        <CartSidebar />
                        <FloatingCart />
                        <WhatsAppWidget />
                      </AuthModalProvider>
                    </ProductQuickViewProvider>
                  </WishlistProvider>
                </CartProvider>
              </AuthProvider>
            </GoogleProvider>
            <Toaster position="top-center" richColors expand={true} />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
