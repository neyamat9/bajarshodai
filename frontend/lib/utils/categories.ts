import type { Category, SubCategory } from "@/lib/types";

/** Every category below `subs`, depth first, each with how deep it is (0 = directly under the top level). */
export function flattenSubs(subs: SubCategory[], depth = 0): (SubCategory & { depth: number })[] {
  return subs.flatMap((s) => [{ ...s, depth }, ...flattenSubs(s.children ?? [], depth + 1)]);
}

/** Looks a category up anywhere in a top-level category's tree. */
export function findSub(subs: SubCategory[], slug: string): SubCategory | undefined {
  for (const s of subs) {
    if (s.slug === slug) return s;
    const hit = findSub(s.children ?? [], slug);
    if (hit) return hit;
  }
  return undefined;
}

/** The slugs from the top-level category down to `slug` (inclusive), or [] when it is not in this tree. */
export function pathTo(cat: Category, slug: string): string[] {
  if (cat.slug === slug) return [cat.slug];
  const walk = (subs: SubCategory[], trail: string[]): string[] => {
    for (const s of subs) {
      const next = [...trail, s.slug];
      if (s.slug === slug) return next;
      const deeper = walk(s.children ?? [], next);
      if (deeper.length) return deeper;
    }
    return [];
  };
  const found = walk(cat.subCategories, [cat.slug]);
  return found;
}

/** The address of a category page: the top level has its own page, deeper ones are `?sub=`. */
export function categoryHref(top: string, slug: string): string {
  return slug === top ? `/category/${top}` : `/category/${top}?sub=${slug}`;
}

export interface TrailItem {
  slug: string;
  name: string;
  /** the next level below it */
  children: SubCategory[];
}

/** The top-level category and every level down to `slug`, each with its own children (for the breadcrumb and the quick links). */
export function trailOf(cat: Category, slug?: string | null): TrailItem[] {
  const trail: TrailItem[] = [{ slug: cat.slug, name: cat.name, children: cat.subCategories }];
  if (!slug || slug === cat.slug) return trail;
  const walk = (subs: SubCategory[]): SubCategory[] => {
    for (const s of subs) {
      if (s.slug === slug) return [s];
      const deeper = walk(s.children ?? []);
      if (deeper.length) return [s, ...deeper];
    }
    return [];
  };
  for (const s of walk(cat.subCategories)) trail.push({ slug: s.slug, name: s.name, children: s.children ?? [] });
  return trail;
}
