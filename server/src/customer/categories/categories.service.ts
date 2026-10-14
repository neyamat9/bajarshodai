import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CategoryNode,
  CategoryTreeService,
} from '../../common/categories';

/** Finds a node anywhere in the tree. */
function find(nodes: CategoryNode[], slug: string): CategoryNode | undefined {
  for (const n of nodes) {
    if (n.slug === slug) return n;
    const hit = find(n.children, slug);
    if (hit) return hit;
  }
  return undefined;
}

/** Adds `subCategories` (= the direct children) next to `children` for the older storefront code. */
function withAlias(n: CategoryNode): CategoryNode & {
  subCategories: CategoryNode[];
} {
  return {
    ...n,
    children: n.children.map(withAlias),
    subCategories: n.children.map(withAlias),
  };
}

@Injectable()
export class CategoriesService {
  constructor(private tree: CategoryTreeService) {}

  /** The whole shop tree: top-level categories with their children nested. */
  async findAll() {
    return (await this.tree.tree()).map(withAlias);
  }

  async findBySlug(slug: string) {
    const node = find(await this.tree.tree(), slug);
    if (!node) throw new NotFoundException('Category not found');
    return { ...withAlias(node), path: await this.tree.path(node.id) };
  }

  // The direct children of a category, each with its number of active products.
  async findSubCategories(slug: string) {
    const node = find(await this.tree.tree(), slug);
    if (!node) throw new NotFoundException('Category not found');
    const { id, name, nameBn, slug: s, image, icon } = node;
    return {
      category: { id, name, nameBn, slug: s, image, icon },
      subCategories: node.children.map((c) => ({
        id: c.id,
        name: c.name,
        nameBn: c.nameBn,
        slug: c.slug,
        image: c.image,
        icon: c.icon,
        description: c.description,
        displayOrder: c.displayOrder,
        productCount: c.productCount,
      })),
      path: await this.tree.path(node.id),
    };
  }
}
