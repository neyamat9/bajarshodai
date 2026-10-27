import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache';
import { StorefrontSyncService } from '../../common/storefront/storefront-sync.service';
import { writeAudit } from '../../common/audit/audit.service';
import { UpdateFeaturedProductsDto } from './dto/featured-products.dto';

const featuredSelect = {
  id: true,
  name: true,
  nameBn: true,
  slug: true,
  productCode: true,
  regularPrice: true,
  sellingPrice: true,
  stock: true,
  status: true,
  isFeatured: true,
  featuredOrder: true,
  brandName: true,
  categoryName: true,
  images: {
    orderBy: [{ isMain: 'desc' as const }, { order: 'asc' as const }],
    take: 1,
    select: { url: true, alt: true },
  },
  unit: {
    select: {
      shortLabel: true,
      shortLabelBn: true,
    },
  },
} satisfies Prisma.ProductSelect;

@Injectable()
export class FeaturedProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly storefrontSync: StorefrontSyncService,
  ) {}

  /**
   * Returns all active featured products ordered by featuredOrder (1 to 18).
   */
  async getFeaturedProducts() {
    const products = await this.prisma.product.findMany({
      where: {
        isFeatured: true,
      },
      select: featuredSelect,
      orderBy: [{ featuredOrder: 'asc' }, { id: 'asc' }],
    });

    return products.map((p) => ({
      ...p,
      regularPrice: Number(p.regularPrice),
      sellingPrice: Number(p.sellingPrice),
      stock: Number(p.stock),
      mainImage: p.images[0]?.url || null,
    }));
  }

  /**
   * Atomically updates which products are featured in আজকের তাজা বাজার and their exact sequence.
   */
  async updateFeaturedProducts(dto: UpdateFeaturedProductsDto, adminUser: User) {
    const { productIds } = dto;

    // Check for duplicates
    if (new Set(productIds).size !== productIds.length) {
      throw new BadRequestException('Each product ID may only appear once in the featured list.');
    }

    if (productIds.length > 18) {
      throw new BadRequestException('Cannot feature more than 18 products in আজকের তাজা বাজার.');
    }

    // Verify all specified products exist
    if (productIds.length > 0) {
      const existing = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true },
      });
      if (existing.length !== productIds.length) {
        const found = new Set(existing.map((e) => e.id));
        const missing = productIds.filter((id) => !found.has(id));
        throw new BadRequestException(`Products not found: ${missing.join(', ')}`);
      }
    }

    // Run atomic update in a transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. Un-feature products not in the new list
      await tx.product.updateMany({
        where: {
          id: { notIn: productIds },
          isFeatured: true,
        },
        data: {
          isFeatured: false,
          featuredOrder: null,
        },
      });

      // 2. Set isFeatured and featuredOrder for each item in the array
      for (let i = 0; i < productIds.length; i++) {
        await tx.product.update({
          where: { id: productIds[i] },
          data: {
            isFeatured: true,
            featuredOrder: i + 1,
          },
        });
      }

      // Record audit trail inside transaction
      await writeAudit(tx, {
        adminId: adminUser.id,
        action: 'PRODUCT_UPDATED',
        entity: 'product',
        entityId: 'featured_products_home',
        newValue: { count: productIds.length, productIds },
      });
    });

    // Invalidate API home cache & notify storefront revalidation
    await this.cache.delByPrefix('products:home');
    this.storefrontSync.notify(['home', 'products']);

    return this.getFeaturedProducts();
  }
}
