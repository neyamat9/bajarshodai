import { lang, setLang, type Lang } from "@/i18n";
import { cn } from "@/lib/utils";

/** বাংলা | English: the whole dashboard changes at once and the choice is remembered. */
export function LanguageToggle({ className }: { className?: string }) {
  const now = lang();
  const btn = (l: Lang, label: string, title: string) => (
    <button
      type="button"
      onClick={() => l !== now && setLang(l)}
      aria-pressed={now === l}
      title={title}
      className={cn(
        "h-7 cursor-pointer rounded px-2 text-xs font-semibold transition-colors",
        now === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
  return (
    <div role="group" aria-label="Language" className={cn("flex items-center rounded border border-border bg-background p-0.5", className)}>
      {btn("en", "EN", "English")}
      {btn("bn", "বাং", "বাংলা")}
    </div>
  );
}
