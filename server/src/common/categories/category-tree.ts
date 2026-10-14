import { PrismaService } from '../../prisma/prisma.service';

export interface TreeRow {
  id: string;
  parentCategoryId: string | null;
}

/** ids of a category and everything below it (any depth). */
export function descendantIds(rows: TreeRow[], rootId: string): string[] {
  const children = new Map<string, string[]>();
  for (const r of rows) {
    if (!r.parentCategoryId) continue;
    const list = children.get(r.parentCategoryId) ?? [];
    list.push(r.id);
    children.set(r.parentCategoryId, list);
  }
  const out: string[] = [];
  const seen = new Set<string>();
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue; // a broken loop in the data must not hang the shop
    seen.add(id);
    out.push(id);
    stack.push(...(children.get(id) ?? []));
  }
  return out;
}

/** Would making `parentId` the parent of `id` create a loop (a category under itself)? */
export function wouldLoop(rows: TreeRow[], id: string, parentId: string | null): boolean {
  if (!parentId) return false;
  return descendantIds(rows, id).includes(parentId);
}

export async function loadTreeRows(prisma: PrismaService): Promise<TreeRow[]> {
  return prisma.category.findMany({ select: { id: true, parentCategoryId: true } });
}
