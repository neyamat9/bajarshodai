import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DateRange } from '../../common/export/date-range';
import { Table } from '../../common/export/table-export';
import { AnalyticsService, Granularity } from '../analytics/analytics.service';
import { SKU_ROWS } from '../inventory/inventory.service';

export const REPORT_MAX_ROWS = 50000;
const round2 = (n: number) => Math.round(n * 100) / 100;

const ts = (d: Date) =>
  Prisma.sql`(${d.toISOString()}::timestamptz AT TIME ZONE 'UTC')`;
const VALID = Prisma.sql`o.status NOT IN ('CANCELLED', 'REFUNDED')`;
const rangeMeta = (r: DateRange) => ({
  From: r.from.toISOString(),
  To: r.to.toISOString(),
  Note: 'Orders that were cancelled or fully refunded are not counted',
});

function assertNotTruncated(rows: unknown[]) {
  if (rows.length > REPORT_MAX_ROWS) {
    throw new BadRequestException(
      `This report has more than ${REPORT_MAX_ROWS} rows. Use a shorter date range.`,
    );
  }
}

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private analytics: AnalyticsService,
  ) {}

  async sales(r: DateRange, g: Granularity): Promise<Table> {
    const series = await this.analytics.salesSeries(r, g);
    const sum = (
      k: 'orders' | 'units' | 'revenue' | 'discounts' | 'shipping',
    ) => series.reduce((s, x) => s + x[k], 0);
    const orders = sum('orders');
    return {
      title: 'Sales',
      filename: `sales-by-${g}`,
      meta: { ...rangeMeta(r), Grouped: `by ${g}` },
      columns: [
        {
          key: 'period',
          header:
            g === 'day' ? 'Date' : g === 'week' ? 'Week starting' : 'Month',
        },
        { key: 'orders', header: 'Orders', type: 'int' },
        { key: 'units', header: 'Units sold', type: 'int' },
        { key: 'revenue', header: 'Revenue', type: 'money' },
        { key: 'discounts', header: 'Discounts given', type: 'money' },
        { key: 'shipping', header: 'Shipping charged', type: 'money' },
        { key: 'avgOrderValue', header: 'Average order', type: 'money' },
      ],
      rows: series,
      totals: {
        period: 'Total',
        orders,
        units: sum('units'),
        revenue: round2(sum('revenue')),
        discounts: round2(sum('discounts')),
        shipping: round2(sum('shipping')),
        avgOrderValue: orders ? round2(sum('revenue') / orders) : 0,
      },
    };
  }

  async productPerformance(
    r: DateRange,
    includeUnsold: boolean,
    pagination?: { page: number; limit: number },
  ): Promise<Table> {
    const totalsRaw = await this.prisma.$queryRaw<
      {
        total: number;
        units: number;
        orders: number;
        revenue: number;
        cost: number;
      }[]
    >(Prisma.sql`
      SELECT 
        COUNT(*)::int AS total,
        COALESCE(SUM(s.units), 0)::int AS units,
        COALESCE(SUM(s.orders), 0)::int AS orders,
        COALESCE(SUM(s.revenue), 0)::float8 AS revenue,
        COALESCE(SUM(COALESCE(s.units, 0) * p."buyingPrice"), 0)::float8 AS cost
      FROM "Product" p
      ${includeUnsold ? Prisma.sql`LEFT JOIN` : Prisma.sql`JOIN`} (
        SELECT i."productId", SUM(i.quantity) AS units, SUM(i.total) AS revenue,
               COUNT(DISTINCT i."orderId") AS orders
        FROM "OrderItem" i JOIN "Order" o ON o.id = i."orderId"
        WHERE ${VALID} AND o."placedAt" >= ${ts(r.from)} AND o."placedAt" < ${ts(r.to)}
        GROUP BY i."productId"
      ) s ON s."productId" = p.id
    `);
    const summary = totalsRaw[0] ?? {
      total: 0,
      units: 0,
      orders: 0,
      revenue: 0,
      cost: 0,
    };

    const limitClause = pagination
      ? Prisma.sql`LIMIT ${pagination.limit} OFFSET ${(pagination.page - 1) * pagination.limit}`
      : Prisma.sql`LIMIT ${REPORT_MAX_ROWS + 1}`;

    const rows = await this.prisma.$queryRaw<
      {
        name: string;
        code: string | null;
        category: string | null;
        brand: string | null;
        status: string;
        units: number;
        orders: number;
        revenue: number;
        cost: number;
        stock: number;
        views: number;
        rating: number;
        reviews: number;
      }[]
    >(Prisma.sql`
      SELECT p.name, p."productCode" AS code, p."categoryName" AS category, p."brandName" AS brand,
             p.status::text AS status,
             COALESCE(s.units, 0)::int AS units, COALESCE(s.orders, 0)::int AS orders,
             COALESCE(s.revenue, 0)::float8 AS revenue,
             (COALESCE(s.units, 0) * p."buyingPrice")::float8 AS cost,
             p.stock, p."totalViews" AS views, COALESCE(p."avgRating", 0)::float8 AS rating,
             p."reviewCount" AS reviews
      FROM "Product" p
      ${includeUnsold ? Prisma.sql`LEFT JOIN` : Prisma.sql`JOIN`} (
        SELECT i."productId", SUM(i.quantity) AS units, SUM(i.total) AS revenue,
               COUNT(DISTINCT i."orderId") AS orders
        FROM "OrderItem" i JOIN "Order" o ON o.id = i."orderId"
        WHERE ${VALID} AND o."placedAt" >= ${ts(r.from)} AND o."placedAt" < ${ts(r.to)}
        GROUP BY i."productId"
      ) s ON s."productId" = p.id
      ORDER BY revenue DESC, p.name ASC
      ${limitClause}`);
    if (!pagination) {
      assertNotTruncated(rows);
    }
    const out = rows.map((x) => ({
      ...x,
      revenue: round2(x.revenue),
      cost: round2(x.cost),
      profit: round2(x.revenue - x.cost),
      marginPercent: x.revenue
        ? round2(((x.revenue - x.cost) / x.revenue) * 100)
        : null,
    }));
    const totals = pagination
      ? {
          name: 'Total',
          units: summary.units,
          orders: summary.orders,
          revenue: round2(summary.revenue),
          cost: round2(summary.cost),
          profit: round2(summary.revenue - summary.cost),
        }
      : {
          name: 'Total',
          units: out.reduce((s, x) => s + x.units, 0),
          orders: out.reduce((s, x) => s + x.orders, 0),
          revenue: round2(out.reduce((s, x) => s + x.revenue, 0)),
          cost: round2(out.reduce((s, x) => s + x.cost, 0)),
          profit: round2(out.reduce((s, x) => s + x.profit, 0)),
        };
    return {
      title: 'Product performance',
      filename: 'product-performance',
      meta: {
        ...rangeMeta(r),
        'Cost & profit': 'estimated from the current buying price',
        Views: 'lifetime views',
      },
      columns: [
        { key: 'name', header: 'Product' },
        { key: 'code', header: 'Code' },
        { key: 'category', header: 'Category' },
        { key: 'brand', header: 'Brand' },
        { key: 'status', header: 'Status' },
        { key: 'units', header: 'Units sold', type: 'int' },
        { key: 'orders', header: 'Orders', type: 'int' },
        { key: 'revenue', header: 'Revenue', type: 'money' },
        { key: 'cost', header: 'Est. cost', type: 'money' },
        { key: 'profit', header: 'Est. profit', type: 'money' },
        { key: 'marginPercent', header: 'Margin %', type: 'percent' },
        { key: 'stock', header: 'Stock now', type: 'int' },
        { key: 'views', header: 'Views (lifetime)', type: 'int' },
        { key: 'rating', header: 'Rating', type: 'number' },
        { key: 'reviews', header: 'Reviews', type: 'int' },
      ],
      rows: out,
      totals,
      pagination: pagination
        ? {
            page: pagination.page,
            limit: pagination.limit,
            total: summary.total,
            totalPages: Math.max(1, Math.ceil(summary.total / pagination.limit)),
          }
        : undefined,
    };
  }

  async stockValuation(
    pagination?: { page: number; limit: number },
  ): Promise<Table> {
    const summaryRaw = await this.prisma.$queryRaw<
      {
        total: number;
        stock: number;
        costValue: number;
        retailValue: number;
      }[]
    >(Prisma.sql`
      SELECT 
        COUNT(*)::int AS total,
        COALESCE(SUM(CASE WHEN s."trackStock" THEN GREATEST(0, s.stock) ELSE 0 END), 0)::int AS stock,
        COALESCE(SUM(CASE WHEN s."trackStock" THEN GREATEST(0, s.stock) * s.cost::float8 ELSE 0 END), 0)::float8 AS "costValue",
        COALESCE(SUM(CASE WHEN s."trackStock" THEN GREATEST(0, s.stock) * s.retail::float8 ELSE 0 END), 0)::float8 AS "retailValue"
      FROM (${SKU_ROWS}) s WHERE status NOT IN ('DISCONTINUED')
    `);
    const summary = summaryRaw[0] ?? {
      total: 0,
      stock: 0,
      costValue: 0,
      retailValue: 0,
    };

    const limitClause = pagination
      ? Prisma.sql`LIMIT ${pagination.limit} OFFSET ${(pagination.page - 1) * pagination.limit}`
      : Prisma.sql`LIMIT ${REPORT_MAX_ROWS + 1}`;

    const rows = await this.prisma.$queryRaw<
      {
        sku: string | null;
        productName: string;
        variantName: string | null;
        status: string;
        stock: number;
        cost: string;
        retail: string;
        trackStock: boolean;
      }[]
    >(Prisma.sql`
      SELECT * FROM (${SKU_ROWS}) s WHERE status NOT IN ('DISCONTINUED')
      ORDER BY "productName" ASC, "variantName" ASC NULLS FIRST
      ${limitClause}`);
    if (!pagination) {
      assertNotTruncated(rows);
    }
    const out = rows.map((x) => {
      const units = x.trackStock ? Math.max(0, x.stock) : 0;
      const cost = Number(x.cost);
      const retail = Number(x.retail);
      return {
        sku: x.sku,
        product: x.productName,
        variant: x.variantName,
        status: x.status,
        stock: x.trackStock ? x.stock : 0,
        cost,
        price: retail,
        costValue: x.trackStock ? round2(units * cost) : 0,
        retailValue: x.trackStock ? round2(units * retail) : 0,
      };
    });
    const sum = (k: 'stock' | 'costValue' | 'retailValue') =>
      out.reduce((s, x) => s + (k === 'stock' ? Math.max(0, x[k]) : x[k]), 0);
    const totals = pagination
      ? {
          sku: 'Total',
          stock: summary.stock,
          costValue: round2(summary.costValue),
          retailValue: round2(summary.retailValue),
        }
      : {
          sku: 'Total',
          stock: sum('stock'),
          costValue: round2(sum('costValue')),
          retailValue: round2(sum('retailValue')),
        };
    return {
      title: 'Stock valuation',
      filename: 'stock-valuation',
      meta: {
        'As of': new Date().toISOString(),
        Note: 'Cost value = stock × buying price; retail value = stock × current selling price. Negative stock counts as 0.',
      },
      columns: [
        { key: 'sku', header: 'SKU / code' },
        { key: 'product', header: 'Product' },
        { key: 'variant', header: 'Variant' },
        { key: 'status', header: 'Status' },
        { key: 'stock', header: 'Stock', type: 'int' },
        { key: 'cost', header: 'Unit cost', type: 'money' },
        { key: 'price', header: 'Unit price', type: 'money' },
        { key: 'costValue', header: 'Cost value', type: 'money' },
        { key: 'retailValue', header: 'Retail value', type: 'money' },
      ],
      rows: out,
      totals,
      pagination: pagination
        ? {
            page: pagination.page,
            limit: pagination.limit,
            total: summary.total,
            totalPages: Math.max(1, Math.ceil(summary.total / pagination.limit)),
          }
        : undefined,
    };
  }

  async couponPerformance(r: DateRange): Promise<Table> {
    const rows = await this.prisma.$queryRaw<
      {
        code: string;
        discountType: string;
        discountValue: number;
        isActive: boolean;
        validFrom: Date;
        validTo: Date;
        maxUsageCount: number | null;
        usageCount: number;
        uses: number;
        discount: number;
        revenue: number;
        customers: number;
      }[]
    >(Prisma.sql`
      SELECT c.code, c."discountType"::text AS "discountType", c."discountValue"::float8 AS "discountValue",
             c."isActive", c."validFrom", c."validTo", c."maxUsageCount", c."usageCount",
             COALESCE(u.uses, 0)::int AS uses, COALESCE(u.discount, 0)::float8 AS discount,
             COALESCE(u.revenue, 0)::float8 AS revenue, COALESCE(u.customers, 0)::int AS customers
      FROM "Coupon" c
      LEFT JOIN (
        SELECT cu."couponId", COUNT(*) AS uses, SUM(cu."discountAmount") AS discount,
               SUM(o.total) AS revenue,
               COUNT(DISTINCT COALESCE(cu."userId", cu."guestPhone")) AS customers
        FROM "CouponUsage" cu LEFT JOIN "Order" o ON o.id = cu."orderId"
        WHERE cu."usedAt" >= ${ts(r.from)} AND cu."usedAt" < ${ts(r.to)}
        GROUP BY cu."couponId"
      ) u ON u."couponId" = c.id
      ORDER BY discount DESC, c.code ASC
      LIMIT ${REPORT_MAX_ROWS + 1}`);
    assertNotTruncated(rows);
    const now = new Date();
    const out = rows.map((x) => ({
      code: x.code,
      type: x.discountType,
      value: x.discountValue,
      state: !x.isActive
        ? 'inactive'
        : x.validTo < now
          ? 'expired'
          : x.validFrom > now
            ? 'scheduled'
            : x.maxUsageCount !== null && x.usageCount >= x.maxUsageCount
              ? 'used up'
              : 'active',
      validFrom: x.validFrom,
      validTo: x.validTo,
      uses: x.uses,
      customers: x.customers,
      discount: round2(x.discount),
      revenue: round2(x.revenue),
      lifetimeUses: x.usageCount,
      limit: x.maxUsageCount,
    }));
    return {
      title: 'Coupon performance',
      filename: 'coupon-performance',
      meta: {
        ...rangeMeta(r),
        Note: 'Uses, discount and revenue are for the date range; lifetime uses is all time. Revenue = total of the orders that used the coupon.',
      },
      columns: [
        { key: 'code', header: 'Code' },
        { key: 'type', header: 'Type' },
        { key: 'value', header: 'Value', type: 'number' },
        { key: 'state', header: 'State' },
        { key: 'validFrom', header: 'Valid from', type: 'date' },
        { key: 'validTo', header: 'Valid to', type: 'date' },
        { key: 'uses', header: 'Uses', type: 'int' },
        { key: 'customers', header: 'Customers', type: 'int' },
        { key: 'discount', header: 'Discount given', type: 'money' },
        { key: 'revenue', header: 'Order revenue', type: 'money' },
        { key: 'lifetimeUses', header: 'Lifetime uses', type: 'int' },
        { key: 'limit', header: 'Usage limit', type: 'int' },
      ],
      rows: out,
      totals: {
        code: 'Total',
        uses: out.reduce((s, x) => s + x.uses, 0),
        discount: round2(out.reduce((s, x) => s + x.discount, 0)),
        revenue: round2(out.reduce((s, x) => s + x.revenue, 0)),
      },
    };
  }

  async customers(
    r: DateRange,
    pagination?: { page: number; limit: number },
  ): Promise<Table> {
    const summaryRaw = await this.prisma.$queryRaw<
      {
        total: number;
        orders: number;
        spent: number;
      }[]
    >(Prisma.sql`
      SELECT 
        COUNT(DISTINCT u.id)::int AS total,
        COUNT(o.id)::int AS orders,
        COALESCE(SUM(o.total), 0)::float8 AS spent
      FROM "User" u JOIN "Order" o ON o."userId" = u.id
      WHERE ${VALID} AND o."placedAt" >= ${ts(r.from)} AND o."placedAt" < ${ts(r.to)}
    `);
    const summary = summaryRaw[0] ?? { total: 0, orders: 0, spent: 0 };

    const limitClause = pagination
      ? Prisma.sql`LIMIT ${pagination.limit} OFFSET ${(pagination.page - 1) * pagination.limit}`
      : Prisma.sql`LIMIT ${REPORT_MAX_ROWS + 1}`;

    const rows = await this.prisma.$queryRaw<
      {
        name: string;
        email: string;
        phone: string | null;
        status: string;
        registeredAt: Date;
        orders: number;
        spent: number;
        lastOrderAt: Date;
        isNew: boolean;
        lifetimeOrders: number;
        lifetimeSpent: number;
      }[]
    >(Prisma.sql`
      SELECT u.name, u.email, u.phone, u.status::text AS status, u."createdAt" AS "registeredAt",
             COUNT(o.id)::int AS orders, SUM(o.total)::float8 AS spent, MAX(o."placedAt") AS "lastOrderAt",
             (u."createdAt" >= ${ts(r.from)} AND u."createdAt" < ${ts(r.to)}) AS "isNew",
             (SELECT COUNT(*)::int FROM "Order" x WHERE x."userId" = u.id AND x.status NOT IN ('CANCELLED','REFUNDED')) AS "lifetimeOrders",
             (SELECT COALESCE(SUM(x.total), 0)::float8 FROM "Order" x WHERE x."userId" = u.id AND x.status NOT IN ('CANCELLED','REFUNDED')) AS "lifetimeSpent"
      FROM "User" u JOIN "Order" o ON o."userId" = u.id
      WHERE ${VALID} AND o."placedAt" >= ${ts(r.from)} AND o."placedAt" < ${ts(r.to)}
      GROUP BY u.id ORDER BY spent DESC, u.name ASC
      ${limitClause}`);
    if (!pagination) {
      assertNotTruncated(rows);
    }
    const out = rows.map((x) => ({
      ...x,
      spent: round2(x.spent),
      lifetimeSpent: round2(x.lifetimeSpent),
      avgOrderValue: x.orders ? round2(x.spent / x.orders) : 0,
      newCustomer: x.isNew ? 'yes' : 'no',
    }));
    const orders = pagination ? summary.orders : out.reduce((s, x) => s + x.orders, 0);
    const spent = pagination ? round2(summary.spent) : round2(out.reduce((s, x) => s + x.spent, 0));
    return {
      title: 'Customers',
      filename: 'customers-report',
      meta: {
        ...rangeMeta(r),
        Note: 'Registered customers who ordered in the date range (guest orders are not included)',
      },
      columns: [
        { key: 'name', header: 'Name' },
        { key: 'email', header: 'Email' },
        { key: 'phone', header: 'Phone' },
        { key: 'status', header: 'Status' },
        { key: 'registeredAt', header: 'Registered', type: 'date' },
        { key: 'newCustomer', header: 'New in range' },
        { key: 'orders', header: 'Orders', type: 'int' },
        { key: 'spent', header: 'Spent', type: 'money' },
        { key: 'avgOrderValue', header: 'Average order', type: 'money' },
        { key: 'lastOrderAt', header: 'Last order', type: 'date' },
        { key: 'lifetimeOrders', header: 'Lifetime orders', type: 'int' },
        { key: 'lifetimeSpent', header: 'Lifetime spent', type: 'money' },
      ],
      rows: out,
      totals: {
        name: 'Total',
        orders,
        spent,
        avgOrderValue: orders ? round2(spent / orders) : 0,
      },
      pagination: pagination
        ? {
            page: pagination.page,
            limit: pagination.limit,
            total: summary.total,
            totalPages: Math.max(1, Math.ceil(summary.total / pagination.limit)),
          }
        : undefined,
    };
  }
}
