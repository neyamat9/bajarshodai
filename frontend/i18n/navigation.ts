import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware replacements for next/link and the next/navigation helpers:
// links and redirects keep the visitor's language (/products or /en/products).
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
