import { Link } from "@/i18n/navigation";

// Bazar Shodai lockup: the wide logo (cart mark + বাজার সদাই). The artwork has a
// white background, so in light mode it is multiplied into the page colour and in
// dark mode (or on surfaces that stay dark) it sits on a small white tile.
export default function BrandLogo({
  size = "md",
  tagline = false,
  asLink = true,
  tone = "default",
}: {
  size?: "sm" | "md" | "lg" | "xl";
  tagline?: boolean;
  asLink?: boolean;
  /** "onDark" is for surfaces that stay dark in both themes (footer, auth panel) */
  tone?: "default" | "onDark";
}) {
  const dims = {
    sm: { img: "h-9", tag: "text-[8px]" },
    md: { img: "h-10 sm:h-12", tag: "text-[9px]" },
    lg: { img: "h-12 sm:h-14", tag: "text-[10px]" },
    xl: { img: "h-16 sm:h-20", tag: "text-xs" },
  }[size];
  const onDark = tone === "onDark";

  const body = (
    <span className="group flex flex-col items-start">
      <span className={`flex items-center rounded ${onDark ? "bg-white px-2 py-1" : "dark:bg-white dark:px-2 dark:py-1"}`}>
        {/* the artwork is 2800x840: multiply melts its white background into the page in light mode */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-wide.webp"
          alt="Bazar Shodai"
          width={1400}
          height={420}
          className={`${dims.img} w-auto object-contain ${onDark ? "" : "mix-blend-multiply dark:mix-blend-normal"}`}
        />
      </span>
      {tagline && (
        <span
          className={`${dims.tag} mt-1 font-bold uppercase tracking-[0.2em] transition-colors group-hover:text-accent-text ${
            onDark ? "text-white/60" : "text-muted-foreground"
          }`}
        >
          Fresh daily needs, at your door
        </span>
      )}
    </span>
  );

  return asLink ? (
    <Link href="/" aria-label="Bazar Shodai home" className="inline-flex">
      {body}
    </Link>
  ) : (
    body
  );
}
