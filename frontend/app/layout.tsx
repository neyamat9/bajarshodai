// The real root layout (the <html> element, fonts, providers) is app/[locale]/layout.tsx,
// because the page language decides <html lang> and the font.
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
