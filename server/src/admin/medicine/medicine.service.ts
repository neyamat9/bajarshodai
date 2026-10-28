import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MedExService } from '../../common/medex';
import { CacheService } from '../../common/cache';
import { writeAudit } from '../../common/audit';
import { MedicineListQueryDto } from './dto/medicine.dto';

@Injectable()
export class MedicineService {
  private readonly logger = new Logger(MedicineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly medex: MedExService,
    private readonly cache: CacheService,
  ) {}

  /**
   * Search brand medicines live from MedEx for autocomplete
   */
  async lookup(query: string) {
    if (!query || query.trim().length < 2) return [];
    return this.medex.search(query.trim());
  }

  /**
   * Fetch full pharmaceutical details from MedEx brand page
   */
  async getDetail(url: string) {
    if (!url) throw new BadRequestException('MedEx URL is required');
    const detail = await this.medex.getBrandDetail(url);
    if (!detail) {
      throw new NotFoundException('Could not retrieve medicine detail from MedEx');
    }
    return detail;
  }

  /**
   * List all medicines in the catalog with MedicineMeta, with search & faceted filters
   */
  async list(query: MedicineListQueryDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      medicineMeta: { isNot: null },
    };

    const and: Prisma.ProductWhereInput[] = [];

    if (query.search?.trim()) {
      const s = query.search.trim();
      and.push({
        OR: [
          { name: { contains: s, mode: 'insensitive' } },
          { nameBn: { contains: s, mode: 'insensitive' } },
          { medicineMeta: { genericName: { contains: s, mode: 'insensitive' } } },
          { medicineMeta: { manufacturer: { contains: s, mode: 'insensitive' } } },
          { medicineMeta: { dosageForm: { contains: s, mode: 'insensitive' } } },
        ],
      });
    }

    if (query.dosageForm?.trim()) {
      and.push({
        medicineMeta: { dosageForm: { equals: query.dosageForm.trim(), mode: 'insensitive' } },
      });
    }

    if (query.generic?.trim()) {
      and.push({
        medicineMeta: { genericName: { contains: query.generic.trim(), mode: 'insensitive' } },
      });
    }

    if (query.brand?.trim()) {
      const b = query.brand.trim();
      and.push({
        OR: [
          { name: { contains: b, mode: 'insensitive' } },
          { brand: { name: { contains: b, mode: 'insensitive' } } },
          { brandName: { contains: b, mode: 'insensitive' } },
          { medicineMeta: { manufacturer: { contains: b, mode: 'insensitive' } } },
        ],
      });
    }

    if (query.type) {
      and.push({
        medicineMeta: { type: query.type },
      });
    }

    if (query.syncStatus && query.syncStatus !== 'ALL') {
      and.push({
        medicineMeta: { syncStatus: query.syncStatus },
      });
    }

    if (and.length) where.AND = and;

    const [items, total, stats] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ updatedAt: 'desc' }],
        include: {
          medicineMeta: true,
          unit: true,
          brand: true,
          category: true,
          images: {
            orderBy: [{ isMain: 'desc' }, { order: 'asc' }],
            take: 1,
          },
        },
      }),
      this.prisma.product.count({ where }),
      this.getStats(),
    ]);

    return {
      items,
      stats,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get KPI statistics for the Medicine Hub
   */
  async getStats() {
    const [total, synced, drift, prescription] = await Promise.all([
      this.prisma.medicineMeta.count(),
      this.prisma.medicineMeta.count({ where: { syncStatus: 'SYNCED' } }),
      this.prisma.medicineMeta.count({ where: { syncStatus: 'DRIFT_DETECTED' } }),
      this.prisma.medicineMeta.count({ where: { type: 'PRESCRIPTION' } }),
    ]);

    return {
      totalMedicines: total,
      syncedMedicines: synced,
      driftCount: drift,
      prescriptionCount: prescription,
    };
  }

  /**
   * Sync price of a single medicine product from MedEx
   */
  async syncProductPrice(productId: string, adminId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { medicineMeta: true },
    });

    if (!product) throw new NotFoundException('Product not found');
    if (!product.medicineMeta) {
      throw new BadRequestException('This product does not have medicine metadata');
    }
    if (!product.medicineMeta.medexUrl) {
      throw new BadRequestException('Product does not have a linked MedEx URL');
    }

    const detail = await this.medex.getBrandDetail(product.medicineMeta.medexUrl);
    if (!detail) {
      await this.prisma.medicineMeta.update({
        where: { productId },
        data: { syncStatus: 'FAILED', lastSyncedAt: new Date() },
      });
      throw new BadRequestException('Failed to fetch details from MedEx');
    }

    const oldSellingPrice = Number(product.sellingPrice);
    const newPriceCandidate = detail.stripPrice ?? detail.unitPrice ?? detail.boxPrice;

    // Check if price drifted
    let syncStatus = 'SYNCED';
    let priceChanged = false;

    if (newPriceCandidate && Math.abs(newPriceCandidate - oldSellingPrice) > 0.01) {
      syncStatus = 'DRIFT_DETECTED';
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const meta = await tx.medicineMeta.update({
        where: { productId },
        data: {
          genericName: detail.genericName || product.medicineMeta!.genericName,
          genericSlug: detail.genericSlug || product.medicineMeta!.genericSlug,
          manufacturer: detail.companyName || product.medicineMeta!.manufacturer,
          dosageForm: detail.dosageForm || product.medicineMeta!.dosageForm,
          strength: detail.strength || product.medicineMeta!.strength,
          mrpUnit: detail.unitPrice ?? product.medicineMeta!.mrpUnit,
          mrpStrip: detail.stripPrice ?? product.medicineMeta!.mrpStrip,
          mrpBox: detail.boxPrice ?? product.medicineMeta!.mrpBox,
          packSizeInfo: detail.packSizeInfo || product.medicineMeta!.packSizeInfo,
          lastSyncedAt: new Date(),
          syncStatus,
        },
      });

      return { ...product, medicineMeta: meta, priceChanged, detectedDrift: syncStatus === 'DRIFT_DETECTED', marketPrice: newPriceCandidate };
    });

    return updated;
  }

  /**
   * Scan active medicines for price drift against MedEx
   */
  async auditDrift(adminId: string) {
    const medicines = await this.prisma.medicineMeta.findMany({
      where: {
        medexUrl: { not: null },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sellingPrice: true,
          },
        },
      },
      take: 50, // Batch limit
    });

    let audited = 0;
    let drifted = 0;
    const drifts: {
      productId: string;
      name: string;
      currentPrice: number;
      medexPrice: number;
      url: string;
    }[] = [];

    for (const med of medicines) {
      if (!med.medexUrl) continue;
      audited++;

      try {
        const detail = await this.medex.getBrandDetail(med.medexUrl);
        if (!detail) continue;

        const currentPrice = Number(med.product.sellingPrice);
        const marketPrice = detail.stripPrice ?? detail.unitPrice ?? detail.boxPrice;

        if (marketPrice && Math.abs(marketPrice - currentPrice) > 0.01) {
          drifted++;
          drifts.push({
            productId: med.productId,
            name: med.product.name,
            currentPrice,
            medexPrice: marketPrice,
            url: med.medexUrl,
          });

          await this.prisma.medicineMeta.update({
            where: { id: med.id },
            data: {
              mrpUnit: detail.unitPrice ?? med.mrpUnit,
              mrpStrip: detail.stripPrice ?? med.mrpStrip,
              mrpBox: detail.boxPrice ?? med.mrpBox,
              syncStatus: 'DRIFT_DETECTED',
              lastSyncedAt: new Date(),
            },
          });
        } else {
          await this.prisma.medicineMeta.update({
            where: { id: med.id },
            data: {
              syncStatus: 'SYNCED',
              lastSyncedAt: new Date(),
            },
          });
        }
      } catch (err) {
        this.logger.warn(`Error auditing drift for ${med.productId}: ${(err as Error).message}`);
      }
    }

    return {
      totalAudited: audited,
      driftedCount: drifted,
      drifts,
    };
  }

  /**
   * Accept the detected drift and apply new price to the product
   */
  async acceptDrift(productId: string, adminId: string, customPrice?: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { medicineMeta: true },
    });

    if (!product || !product.medicineMeta) {
      throw new NotFoundException('Medicine product not found');
    }

    const newPrice =
      customPrice ??
      Number(
        product.medicineMeta.mrpStrip ??
        product.medicineMeta.mrpUnit ??
        product.medicineMeta.mrpBox ??
        product.sellingPrice,
      );

    const oldPrice = Number(product.sellingPrice);

    await this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          sellingPrice: newPrice,
          regularPrice: newPrice,
        },
      });

      await tx.medicineMeta.update({
        where: { productId },
        data: {
          syncStatus: 'SYNCED',
          lastSyncedAt: new Date(),
        },
      });

      if (Math.abs(oldPrice - newPrice) > 0.01) {
        await tx.priceHistory.create({
          data: {
            productId,
            price: newPrice,
          },
        });

        const validAdminId =
          typeof adminId === 'string'
            ? adminId
            : adminId && typeof adminId === 'object' && 'id' in adminId
              ? String((adminId as { id: unknown }).id)
              : '';

        await writeAudit(tx, {
          adminId: validAdminId,
          action: 'PRICE_CHANGED',
          entity: 'Product',
          entityId: productId,
          oldValue: { sellingPrice: oldPrice },
          newValue: { sellingPrice: newPrice, medexUrl: product.medicineMeta?.medexUrl },
        });
      }
    });

    this.cache.delByPrefix('products:');
    return { ok: true, productId, newPrice };
  }

  /**
   * Accept and apply all detected price drifts in 1 click
   */
  async acceptAllDrifts(adminId: string) {
    const drifted = await this.prisma.medicineMeta.findMany({
      where: { syncStatus: 'DRIFT_DETECTED' },
      include: { product: true },
    });

    let updatedCount = 0;

    for (const med of drifted) {
      const newPrice = Number(
        med.mrpStrip ?? med.mrpUnit ?? med.mrpBox ?? med.product.sellingPrice,
      );
      await this.acceptDrift(med.productId, adminId, newPrice);
      updatedCount++;
    }

    return { ok: true, updatedCount };
  }

  /**
   * Get current global medicine discount setting and breakdown statistics
   */
  async getDiscountSettings() {
    const setting = await this.prisma.siteSetting.findUnique({
      where: { key: 'medicine_discount_settings' },
    });
    const parsed = setting?.value ? (typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value) : null;
    const globalPercent = Number(parsed?.globalDiscountPercent ?? 0);

    const [totalCount, globalCount, customCount, noneCount] = await Promise.all([
      this.prisma.medicineMeta.count(),
      this.prisma.medicineMeta.count({ where: { discountMode: 'GLOBAL' } }),
      this.prisma.medicineMeta.count({ where: { discountMode: { in: ['PERCENT', 'FIXED'] } } }),
      this.prisma.medicineMeta.count({ where: { discountMode: 'NONE' } }),
    ]);

    return {
      globalDiscountPercent: globalPercent,
      stats: {
        totalMedicines: totalCount,
        globalCount,
        customCount,
        noneCount,
      },
    };
  }

  /**
   * Set global medicine discount percentage and batch recalculate all medicines in GLOBAL mode
   */
  async setGlobalDiscount(percent: number, adminId?: string) {
    const validPercent = Math.max(0, Math.min(100, Math.round(percent)));

    // 1. Save to SiteSetting
    await this.prisma.siteSetting.upsert({
      where: { key: 'medicine_discount_settings' },
      update: {
        value: JSON.stringify({ globalDiscountPercent: validPercent, updatedAt: new Date() }),
      },
      create: {
        key: 'medicine_discount_settings',
        value: JSON.stringify({ globalDiscountPercent: validPercent, updatedAt: new Date() }),
      },
    });

    // 2. Batch update all medicines in GLOBAL mode
    const count = await this.prisma.$executeRawUnsafe(`
      UPDATE "Product" p
      SET 
        "regularPrice" = COALESCE(m."mrpStrip", m."mrpUnit" * 10, p."sellingPrice"),
        "sellingPrice" = CASE 
          WHEN ${validPercent} > 0 THEN ROUND(COALESCE(m."mrpStrip", m."mrpUnit" * 10, p."sellingPrice") * (1.0 - ${validPercent} / 100.0), 2)
          ELSE COALESCE(m."mrpStrip", m."mrpUnit" * 10, p."sellingPrice")
        END,
        "isDiscounted" = (${validPercent} > 0)
      FROM "MedicineMeta" m
      WHERE p.id = m."productId"
        AND (m."discountMode" = 'GLOBAL' OR m."discountMode" IS NULL);
    `);

    // Invalidate product caches
    this.cache.delByPrefix('products:');

    return {
      ok: true,
      globalDiscountPercent: validPercent,
      updatedMedicinesCount: Number(count),
    };
  }

  /**
   * Set pricing / discount for a single medicine (Custom %, Fixed Price, Inherit Global, or None)
   */
  async setSingleMedicinePricing(
    productId: string,
    dto: { discountMode: 'GLOBAL' | 'PERCENT' | 'FIXED' | 'NONE'; discountValue?: number },
    adminId?: string,
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { medicineMeta: true },
    });
    if (!product || !product.medicineMeta) {
      throw new NotFoundException('Medicine product not found');
    }

    const meta = product.medicineMeta;
    const baseMrp = Number(
      meta.mrpStrip ?? (meta.mrpUnit ? Number(meta.mrpUnit) * 10 : product.regularPrice ?? product.sellingPrice),
    );

    let newSellingPrice = baseMrp;
    let isDiscounted = false;
    let discountVal: number | null = null;

    if (dto.discountMode === 'PERCENT') {
      const pct = Math.max(0, Math.min(100, Number(dto.discountValue || 0)));
      discountVal = pct;
      newSellingPrice = Math.round(baseMrp * (1.0 - pct / 100.0) * 100) / 100;
      isDiscounted = pct > 0;
    } else if (dto.discountMode === 'FIXED') {
      const fixed = Math.max(0, Number(dto.discountValue || 0));
      discountVal = fixed;
      newSellingPrice = fixed;
      isDiscounted = newSellingPrice < baseMrp;
    } else if (dto.discountMode === 'GLOBAL') {
      // Fetch active global discount
      const setting = await this.prisma.siteSetting.findUnique({
        where: { key: 'medicine_discount_settings' },
      });
      const parsed = setting?.value ? (typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value) : null;
      const globalPercent = Number(parsed?.globalDiscountPercent ?? 0);
      if (globalPercent > 0) {
        newSellingPrice = Math.round(baseMrp * (1.0 - globalPercent / 100.0) * 100) / 100;
        isDiscounted = true;
      } else {
        newSellingPrice = baseMrp;
        isDiscounted = false;
      }
    } else if (dto.discountMode === 'NONE') {
      newSellingPrice = baseMrp;
      isDiscounted = false;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.medicineMeta.update({
        where: { id: meta.id },
        data: {
          discountMode: dto.discountMode,
          discountValue: discountVal !== null ? discountVal : null,
        },
      });

      await tx.product.update({
        where: { id: productId },
        data: {
          regularPrice: baseMrp,
          sellingPrice: newSellingPrice,
          isDiscounted,
        },
      });
    });

    this.cache.delByPrefix('products:');

    return {
      ok: true,
      productId,
      discountMode: dto.discountMode,
      discountValue: discountVal,
      regularPrice: baseMrp,
      sellingPrice: newSellingPrice,
      isDiscounted,
    };
  }
}
