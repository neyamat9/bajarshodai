import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../cache';
import { descendantIds } from './category-tree';

export interface FlatCategory {
  id: string;
  name: string;
  nameBn: string | null;
  slug: string;
  image: string | null;
  icon: string | null;
  description: string | null;
  descriptionBn: string | null;
  isHomepage: boolean;
  displayOrder: number;
  parentCategoryId: string | null;
}

export interface CategoryNode extends FlatCategory {
  /** active products in this category and everything below it */
  productCount: number;
  children: CategoryNode[];
}

export interface PathItem {
  id: string;
  slug: string;
  name: string;
  nameBn: string | null;
}

/** The category tree the shop shows: active categories only, cached. */
@Injectable()
export class CategoryTreeService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  /** Every ACTIVE category whose parents are all active too, in display order. */
  async flat(): Promise<FlatCategory[]> {
    return this.cache.getOrSet(
      'categories:flat',
      async () => {
        const all = await this.prisma.category.findMany({
          orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
        });
        const byId = new Map(all.map((c) => [c.id, c]));
        const visible = (id: string | null, guard = 0): boolean => {
          if (!id) return true;
          const c = byId.get(id);
          if (!c || c.status !== 'ACTIVE' || guard > 10) return false;
          return visible(c.parentCategoryId, guard + 1);
        };
        return all
          .filter((c) => c.status === 'ACTIVE' && visible(c.parentCategoryId))
          .map((c) => ({
            id: c.id,
            name: c.name,
            nameBn: c.nameBn,
            slug: c.slug,
            image: c.image,
            icon: c.icon,
            description: c.description,
            descriptionBn: c.descriptionBn,
            isHomepage: c.isHomepage,
            displayOrder: c.displayOrder,
            parentCategoryId: c.parentCategoryId,
          }));
      },
      600,
    );
  }

  /** Roots with their children nested, each with the number of active products below it. */
  async tree(): Promise<CategoryNode[]> {
    return this.cache.getOrSet(
      'categories:tree:v2',
      async () => {
        const rows = await this.flat();
        const counts = await this.prisma.product.groupBy({
          by: ['categoryId'],
          where: { status: 'ACTIVE' },
          _count: { _all: true },
        });
        const own = new Map(counts.map((c) => [c.categoryId, c._count._all]));
        const nodes = new Map<string, CategoryNode>(
          rows.map((r) => [
            r.id,
            { ...r, productCount: own.get(r.id) ?? 0, children: [] },
          ]),
        );
        const roots: CategoryNode[] = [];
        for (const r of rows) {
          const node = nodes.get(r.id)!;
          const parent = r.parentCategoryId
            ? nodes.get(r.parentCategoryId)
            : undefined;
          if (parent) parent.children.push(node);
          else roots.push(node);
        }
        const total = (n: CategoryNode): number => {
          n.productCount += n.children.reduce((s, c) => s + total(c), 0);
          return n.productCount;
        };
        roots.forEach(total);
        return roots;
      },
      600,
    );
  }

  async bySlug(slug: string): Promise<FlatCategory | undefined> {
    return (await this.flat()).find((c) => c.slug === slug);
  }

  /** root → the category itself (for breadcrumbs). */
  async path(id: string): Promise<PathItem[]> {
    const rows = await this.flat();
    const byId = new Map(rows.map((r) => [r.id, r]));
    const out: PathItem[] = [];
    let cur = byId.get(id);
    let guard = 0;
    while (cur && guard++ < 10) {
      out.unshift({
        id: cur.id,
        slug: cur.slug,
        name: cur.name,
        nameBn: cur.nameBn,
      });
      cur = cur.parentCategoryId ? byId.get(cur.parentCategoryId) : undefined;
    }
    return out;
  }

  /** The category and every category below it. */
  async withDescendants(id: string): Promise<string[]> {
    return descendantIds(await this.flat(), id);
  }
}
