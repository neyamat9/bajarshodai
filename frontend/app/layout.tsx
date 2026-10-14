import CartSidebar from "@/components/cart/CartSidebar";
import { AuthModalProvider } from "@/components/auth/AuthModal";
import CompareBar from "@/components/compare/CompareBar";
import FreshnessWatcher from "@/components/layout/FreshnessWatcher";
import ScrollToTop from "@/components/motion/ScrollToTop";
import SmoothScroll from "@/components/motion/SmoothScroll";
import ThemeProvider from "@/components/theme/ThemeProvider";
import { AuthProvider } from "@/lib/context/AuthContext";
import { CartProvider } from "@/lib/context/CartContext";
import { CompareProvider } from "@/lib/context/CompareContext";
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
  title: {
    default: "GadgetBachai – Smart Choice, Better Price",
    template: "%s | GadgetBachai",
  },
  description:
    "GadgetBachai – Smart choice, better price. Shop chargers, power banks, earbuds, smartwatches, phone cases and every gadget accessory you need.",
  keywords: [
    "gadget accessories Bangladesh",
    "power bank BD",
    "earbuds Bangladesh",
    "smartwatch BD",
    "phone accessories Bangladesh",
    "GadgetBachai",
  ],
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
                <CompareProvider>
                  <AuthModalProvider>
                    {children}
                    {/* Global overlays — rendered once, visibility driven by context */}
                    <CartSidebar />
                    <CompareBar />
                  </AuthModalProvider>
                </CompareProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
          <Toaster position="top-center" richColors expand={true} />
        </ThemeProvider>
      </body>
    </html>
  );
}
