import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

// Adds the language to every page address, and remembers the English choice:
// someone who picked English and later opens a plain address (a bookmark) is sent to the /en version.
// Everyone else gets Bangla, whatever language their phone or browser uses.
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasPrefix = /^\/(en|bn)(\/|$)/.test(pathname);
  if (!hasPrefix && req.cookies.get("NEXT_LOCALE")?.value === "en") {
    const url = req.nextUrl.clone();
    url.pathname = `/en${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }
  return intl(req);
}

export const config = {
  // skip the API routes, Next internals and files with an extension (images, icons, fonts…)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
