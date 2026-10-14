import CartSidebar from "@/components/cart/CartSidebar";
import { AuthModalProvider } from "@/components/auth/AuthModal";
import FreshnessWatcher from "@/components/layout/FreshnessWatcher";
import ScrollToTop from "@/components/motion/ScrollToTop";
import SmoothScroll from "@/components/motion/SmoothScroll";
import ThemeProvider from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/lib/context/AuthContext";
import { CartProvider } from "@/lib/context/CartContext";
import { WishlistProvider } from "@/lib/context/WishlistContext";
import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Bazar Shodai (বাজার সদাই) – Fresh daily needs, delivered",
    template: "%s | Bazar Shodai",
  },
  description:
    "Bazar Shodai (বাজার সদাই) – order fresh fish, vegetables, fruits and daily groceries online. Home delivery in Shahrasti, Chandpur.",
  keywords: [
    "online grocery Shahrasti",
    "fresh fish delivery Chandpur",
    "vegetables home delivery Bangladesh",
    "Bazar Shodai",
    "বাজার সদাই",
  ],
  openGraph: {
    siteName: "Bazar Shodai",
    type: "website",
    locale: "bn_BD",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Bazar Shodai" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <noscript>
          <style>{"[data-reveal],[data-hero-item]{opacity:1!important}"}</style>
        </noscript>
      </head>
      <body className={`${inter.variable} ${outfit.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <SmoothScroll />
          <ScrollToTop />
          <FreshnessWatcher />
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <AuthModalProvider>
                  {children}
                  {/* Global overlays — rendered once, visibility driven by context */}
                  <CartSidebar />
                </AuthModalProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
          <Toaster position="top-center" richColors expand={true} />
        </ThemeProvider>
      </body>
    </html>
  );
}
