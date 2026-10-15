import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DateRange } from '../../common/export/date-range';
import { Table } from '../../common/export/table-export';

const MAX_ROWS = 50000;
const round2 = (n: number) => Math.round(n * 100) / 100;
const ts = (d: Date) =>
  Prisma.sql`(${d.toISOString()}::timestamptz AT TIME ZONE 'UTC')`;
// the Bangladesh calendar day of a stored (UTC) time
const day = (col: string) =>
  Prisma.sql`to_char(((${Prisma.raw(col)} AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Dhaka'), 'YYYY-MM-DD')`;
const meta = (r: DateRange) => ({
  From: r.from.toISOString(),
  To: r.to.toISOString(),
});

function guard(rows: unknown[]) {
  if (rows.length > MAX_ROWS) {
    throw new BadRequestException(
      `This report has more than ${MAX_ROWS} rows. Use a shorter date range.`,
    );
  }
}

/** Delivery reports: per rider, per day, and the cash-on-delivery reconciliation. */
@Injectable()
export class DeliveryReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async byRider(r: DateRange): Promise<Table> {
    const rows = await this.prisma.$queryRaw<
      {
        rider: string;
        delivered: number;
        failed: number;
        customers: number;
        avgMinutes: number | null;
        cashCollected: number;
        cashHandedOver: number;
        cashWithRider: number;
      }[]
    >(Prisma.sql`
      SELECT u.name AS rider,
        COUNT(*) FILTER (WHERE d.status = 'DELIVERED' AND d."deliveredAt" >= ${ts(r.from)} AND d."deliveredAt" < ${ts(r.to)})::int AS delivered,
        COUNT(*) FILTER (WHERE d.status = 'FAILED' AND d."failedAt" >= ${ts(r.from)} AND d."failedAt" < ${ts(r.to)})::int AS failed,
        COUNT(DISTINCT d."customerKey") FILTER (WHERE d.status = 'DELIVERED' AND d."deliveredAt" >= ${ts(r.from)} AND d."deliveredAt" < ${ts(r.to)})::int AS customers,
        (AVG(EXTRACT(EPOCH FROM (d."deliveredAt" - d."assignedAt")) / 60) FILTER (WHERE d.status = 'DELIVERED' AND d."deliveredAt" >= ${ts(r.from)} AND d."deliveredAt" < ${ts(r.to)}))::float8 AS "avgMinutes",
        COALESCE(SUM(d."cashCollected") FILTER (WHERE d.status = 'DELIVERED' AND d."deliveredAt" >= ${ts(r.from)} AND d."deliveredAt" < ${ts(r.to)}), 0)::float8 AS "cashCollected",
        COALESCE(SUM(d."cashCollected") FILTER (WHERE d.status = 'DELIVERED' AND d."deliveredAt" >= ${ts(r.from)} AND d."deliveredAt" < ${ts(r.to)} AND d."cashHandedOverAt" IS NOT NULL), 0)::float8 AS "cashHandedOver",
        COALESCE(SUM(d."cashCollected") FILTER (WHERE d.status = 'DELIVERED' AND d."cashHandedOverAt" IS NULL), 0)::float8 AS "cashWithRider"
      FROM "Delivery" d JOIN "User" u ON u.id = d."assigneeId"
      GROUP BY u.id
      HAVING COUNT(*) FILTER (WHERE (d."deliveredAt" >= ${ts(r.from)} AND d."deliveredAt" < ${ts(r.to)}) OR (d."failedAt" >= ${ts(r.from)} AND d."failedAt" < ${ts(r.to)})) > 0
          OR COALESCE(SUM(d."cashCollected") FILTER (WHERE d.status = 'DELIVERED' AND d."cashHandedOverAt" IS NULL), 0) > 0
      ORDER BY delivered DESC, rider ASC
      LIMIT ${MAX_ROWS + 1}`);
    guard(rows);
    const out = rows.map((x) => ({
      ...x,
      successRate:
        x.delivered + x.failed
          ? Math.round((x.delivered / (x.delivered + x.failed)) * 100)
          : null,
      avgMinutes: x.avgMinutes === null ? null : Math.round(x.avgMinutes),
      cashCollected: round2(x.cashCollected),
      cashHandedOver: round2(x.cashHandedOver),
      cashWithRider: round2(x.cashWithRider),
    }));
    const sum = (k: 'delivered' | 'failed') =>
      out.reduce((s, x) => s + x[k], 0);
    const cash = (k: 'cashCollected' | 'cashHandedOver' | 'cashWithRider') =>
      round2(out.reduce((s, x) => s + x[k], 0));
    return {
      title: 'Deliveries per rider',
      filename: 'deliveries-per-rider',
      meta: {
        ...meta(r),
        Note: '"Cash with rider" is everything not yet handed over, whatever the date',
      },
      columns: [
        { key: 'rider', header: 'Rider' },
        { key: 'delivered', header: 'Delivered', type: 'int' },
        { key: 'failed', header: 'Not delivered', type: 'int' },
        { key: 'successRate', header: 'Success %', type: 'percent' },
        { key: 'customers', header: 'Different customers', type: 'int' },
        { key: 'avgMinutes', header: 'Average minutes', type: 'int' },
        { key: 'cashCollected', header: 'Cash taken', type: 'money' },
        { key: 'cashHandedOver', header: 'Handed to shop', type: 'money' },
        { key: 'cashWithRider', header: 'Cash with rider now', type: 'money' },
      ],
      rows: out,
      totals: {
        rider: 'Total',
        delivered: sum('delivered'),
        failed: sum('failed'),
        cashCollected: cash('cashCollected'),
        cashHandedOver: cash('cashHandedOver'),
        cashWithRider: cash('cashWithRider'),
      },
    };
  }

  async byDay(r: DateRange): Promise<Table> {
    const rows = await this.prisma.$queryRaw<
      {
        date: string;
        delivered: number;
        customers: number;
        deliveryCharges: number;
        orderValue: number;
        cashCollected: number;
      }[]
    >(Prisma.sql`
      SELECT ${day('d."deliveredAt"')} AS date,
        COUNT(*)::int AS delivered,
        COUNT(DISTINCT d."customerKey")::int AS customers,
        COALESCE(SUM(o."shippingCost"), 0)::float8 AS "deliveryCharges",
        COALESCE(SUM(o.total), 0)::float8 AS "orderValue",
        COALESCE(SUM(d."cashCollected"), 0)::float8 AS "cashCollected"
      FROM "Delivery" d JOIN "Order" o ON o.id = d."orderId"
      WHERE d.status = 'DELIVERED' AND d."deliveredAt" >= ${ts(r.from)} AND d."deliveredAt" < ${ts(r.to)}
      GROUP BY 1 ORDER BY 1 ASC
      LIMIT ${MAX_ROWS + 1}`);
    guard(rows);
    const failed = await this.prisma.$queryRaw<
      { date: string; failed: number }[]
    >(Prisma.sql`
      SELECT ${day('d."failedAt"')} AS date, COUNT(*)::int AS failed
      FROM "Delivery" d
      WHERE d.status = 'FAILED' AND d."failedAt" >= ${ts(r.from)} AND d."failedAt" < ${ts(r.to)}
      GROUP BY 1`);
    const failedBy = new Map(failed.map((f) => [f.date, f.failed]));
    const dates = new Set([...rows.map((x) => x.date), ...failedBy.keys()]);
    const byDate = new Map(rows.map((x) => [x.date, x]));
    const out = [...dates].sort().map((date) => {
      const x = byDate.get(date);
      return {
        date,
        delivered: x?.delivered ?? 0,
        failed: failedBy.get(date) ?? 0,
        customers: x?.customers ?? 0,
        orderValue: round2(x?.orderValue ?? 0),
        deliveryCharges: round2(x?.deliveryCharges ?? 0),
        cashCollected: round2(x?.cashCollected ?? 0),
      };
    });
    const total = (k: keyof (typeof out)[number]) =>
      out.reduce((s, x) => s + Number(x[k]), 0);
    return {
      title: 'Deliveries per day',
      filename: 'deliveries-per-day',
      meta: {
        ...meta(r),
        Note: 'Days are Bangladesh days. "Different customers" counts each customer once per day.',
      },
      columns: [
        { key: 'date', header: 'Date', type: 'date' },
        { key: 'delivered', header: 'Delivered', type: 'int' },
        { key: 'failed', header: 'Not delivered', type: 'int' },
        { key: 'customers', header: 'Different customers', type: 'int' },
        { key: 'orderValue', header: 'Order value', type: 'money' },
        { key: 'deliveryCharges', header: 'Delivery charges', type: 'money' },
        { key: 'cashCollected', header: 'Cash taken', type: 'money' },
      ],
      rows: out,
      totals: {
        date: 'Total',
        delivered: total('delivered'),
        failed: total('failed'),
        orderValue: round2(total('orderValue')),
        deliveryCharges: round2(total('deliveryCharges')),
        cashCollected: round2(total('cashCollected')),
      },
    };
  }

  /** Cash on delivery: what the order said, what the rider took, what reached the shop. One row per delivery. */
  async codReconciliation(r: DateRange): Promise<Table> {
    const rows = await this.prisma.$queryRaw<
      {
        orderNumber: string;
        rider: string;
        deliveredAt: Date;
        expected: number;
        collected: number;
        handedOverAt: Date | null;
      }[]
    >(Prisma.sql`
      SELECT o."orderNumber", u.name AS rider, d."deliveredAt",
             d."cashToCollect"::float8 AS expected, COALESCE(d."cashCollected", 0)::float8 AS collected,
             d."cashHandedOverAt" AS "handedOverAt"
      FROM "Delivery" d
      JOIN "Order" o ON o.id = d."orderId" JOIN "User" u ON u.id = d."assigneeId"
      WHERE d.status = 'DELIVERED' AND o."paymentMethod" = 'CASH_ON_DELIVERY'
        AND d."deliveredAt" >= ${ts(r.from)} AND d."deliveredAt" < ${ts(r.to)}
      ORDER BY d."deliveredAt" ASC
      LIMIT ${MAX_ROWS + 1}`);
    guard(rows);
    const out = rows.map((x) => {
      const difference = round2(x.collected - x.expected);
      return {
        orderNumber: x.orderNumber,
        rider: x.rider,
        deliveredAt: x.deliveredAt,
        expected: round2(x.expected),
        collected: round2(x.collected),
        difference,
        handedOver: x.handedOverAt ? 'yes' : 'no',
        handedOverAt: x.handedOverAt,
        outstanding: x.handedOverAt ? 0 : round2(x.collected),
      };
    });
    const sum = (k: 'expected' | 'collected' | 'difference' | 'outstanding') =>
      round2(out.reduce((s, x) => s + x[k], 0));
    return {
      title: 'Cash on delivery',
      filename: 'cod-reconciliation',
      meta: {
        ...meta(r),
        Note: 'Difference = cash taken minus what the order said. Outstanding = taken by the rider and not yet handed to the shop.',
      },
      columns: [
        { key: 'orderNumber', header: 'Order' },
        { key: 'rider', header: 'Rider' },
        { key: 'deliveredAt', header: 'Delivered', type: 'date' },
        { key: 'expected', header: 'Order said', type: 'money' },
        { key: 'collected', header: 'Cash taken', type: 'money' },
        { key: 'difference', header: 'Difference', type: 'money' },
        { key: 'handedOver', header: 'Handed to shop' },
        { key: 'handedOverAt', header: 'Handed over on', type: 'date' },
        { key: 'outstanding', header: 'Outstanding', type: 'money' },
      ],
      rows: out,
      totals: {
        orderNumber: 'Total',
        expected: sum('expected'),
        collected: sum('collected'),
        difference: sum('difference'),
        outstanding: sum('outstanding'),
      },
    };
  }
}
