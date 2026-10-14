import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache';
import {
  descendantIds,
  loadTreeRows,
  wouldLoop,
} from '../../common/categories/category-tree';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

const MAX_DEPTH = 5;

@Injectable()
export class CategoryService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  private depthOf(
    rows: { id: string; parentCategoryId: string | null }[],
    id: string | null,
  ): number {
    const byId = new Map(rows.map((r) => [r.id, r.parentCategoryId]));
    let depth = 0;
    let cur = id;
    while (cur && depth <= MAX_DEPTH + 1) {
      depth++;
      cur = byId.get(cur) ?? null;
    }
    return depth;
  }

  private async assertParent(parentId: string | null | undefined, selfId?: string) {
    if (!parentId) return;
    const rows = await loadTreeRows(this.prisma);
    if (!rows.some((r) => r.id === parentId)) {
      throw new BadRequestException('The parent category does not exist');
    }
    if (selfId && wouldLoop(rows, selfId, parentId)) {
      throw new BadRequestException('A category cannot be moved under itself');
    }
    // the moved branch keeps its own depth below it
    const below = selfId
      ? Math.max(
          0,
          ...descendantIds(rows, selfId).map(
            (d) => this.depthOf(rows, d) - this.depthOf(rows, selfId),
          ),
        )
      : 0;
    if (this.depthOf(rows, parentId) + 1 + below > MAX_DEPTH) {
      throw new BadRequestException(
        `Categories can be at most ${MAX_DEPTH} levels deep`,
      );
    }
  }

  private async assertUniqueName(
    name: string | undefined,
    parentId: string | null | undefined,
    selfId?: string,
  ) {
    if (!name) return;
    const clash = await this.prisma.category.findFirst({
      where: {
        name,
        parentCategoryId: parentId ?? null,
        ...(selfId ? { id: { not: selfId } } : {}),
      },
      select: { id: true },
    });
    if (clash) {
      throw new ConflictException(
        'A category with this name already exists here',
      );
    }
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException('Category with this slug already exists');
    }
    await this.assertParent(dto.parentCategoryId);
    await this.assertUniqueName(dto.name, dto.parentCategoryId);

    const created = await this.prisma.category.create({
      data: { ...dto, parentCategoryId: dto.parentCategoryId ?? null },
    });
    this.cache.delByPrefix('categories:');
    this.cache.delByPrefix('home');
    return created;
  }

  /** Every category as a flat list; the dashboard builds the tree from parentCategoryId. */
  async findAll() {
    return this.prisma.category.findMany({
      include: { _count: { select: { products: true, childCategories: true } } },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, childCategories: true } } },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const current = await this.findOne(id);
    if (dto.slug && dto.slug !== current.slug) {
      const clash = await this.prisma.category.findUnique({
        where: { slug: dto.slug },
      });
      if (clash) {
        throw new ConflictException('Category with this slug already exists');
      }
    }
    const parentChanged =
      dto.parentCategoryId !== undefined &&
      (dto.parentCategoryId ?? null) !== current.parentCategoryId;
    if (parentChanged) await this.assertParent(dto.parentCategoryId, id);
    if (parentChanged || (dto.name && dto.name !== current.name)) {
      await this.assertUniqueName(
        dto.name ?? current.name,
        parentChanged ? dto.parentCategoryId : current.parentCategoryId,
        id,
      );
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.parentCategoryId !== undefined
          ? { parentCategoryId: dto.parentCategoryId ?? null }
          : {}),
      },
    });
    // products keep the category name for fast search
    if (dto.name && dto.name !== current.name) {
      await this.prisma.product.updateMany({
        where: { categoryId: id },
        data: { categoryName: dto.name },
      });
    }
    this.cache.delByPrefix('categories:');
    this.cache.delByPrefix('home');
    return updated;
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    if (category._count.childCategories > 0) {
      throw new ConflictException(
        'This category has sub-categories. Move or delete them first.',
      );
    }
    if (category._count.products > 0) {
      throw new ConflictException(
        `This category has ${category._count.products} product(s). Move them to another category first, or set the category to inactive.`,
      );
    }
    const deleted = await this.prisma.category.delete({ where: { id } });
    this.cache.delByPrefix('categories:');
    this.cache.delByPrefix('home');
    return deleted;
  }
}
