import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DeliveryStatus, OrderStatus, Prisma, type User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityLogService } from '../../common/activity';
import { writeAudit, type AuditAction } from '../../common/audit';
import { ACTIVE_DELIVERY } from '../../common/delivery/delivery-sync';
import { normalizeBdPhone } from '../../common/utils/phone';
import { AdminOrdersService } from '../orders/orders.service';
import {
  BoardQueryDto,
  RangeDto,
  FAIL_REASONS,
  CreateSettlementDto,
  ListSettlementsDto,
  SettleSettlementDto,
} from './dto/deliveries.dto';

// An order can be given to a rider once the shop has accepted it and until it is delivered.
const ASSIGNABLE: OrderStatus[] = [
  'CONFIRMED',
  'PROCESSING',
  'ON_HOLD',
  'SHIPPED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
];

const REASON_LABEL: Record<(typeof FAIL_REASONS)[number], string> = {
  CUSTOMER_NOT_REACHABLE: 'Customer not reachable',
  CUSTOMER_REFUSED: 'Customer refused the order',
  WRONG_ADDRESS: 'Wrong address',
  NOBODY_HOME: 'Nobody at the address',
  PAYMENT_PROBLEM: 'Payment problem',
  OTHER: 'Other',
};

const n = (v: Prisma.Decimal | number | null | undefined) =>
  v === null || v === undefined ? 0 : Number(v);
const round2 = (v: number) => Math.round(v * 100) / 100;

// "today" and day edges in Bangladesh time (the server runs with TZ=Asia/Dhaka)
const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
const parseDay = (s: string | undefined, fallback: Date) => {
  if (!s) return fallback;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const orderCard = {
  id: true,
  orderNumber: true,
  status: true,
  paymentMethod: true,
  paymentStatus: true,
  total: true,
  dueAmount: true,
  placedAt: true,
  deliverySlot: true,
  deliveryDate: true,
  deliveryDistanceKm: true,
  deliveryPlaceName: true,
  deliveryLandmark: true,
  deliveryLat: true,
  deliveryLng: true,
  deliveryNote: true,
  customerNote: true,
  guestName: true,
  guestPhone: true,
  user: { select: { id: true, name: true, phone: true } },
  shippingAddress: {
    select: {
      fullName: true,
      phone: true,
      line1: true,
      landmark: true,
      placeName: true,
      latitude: true,
      longitude: true,
    },
  },
} satisfies Prisma.OrderSelect;

type CardOrder = Prisma.OrderGetPayload<{ select: typeof orderCard }>;

const card = (o: CardOrder) => ({
  id: o.id,
  orderNumber: o.orderNumber,
  status: o.status,
  paymentMethod: o.paymentMethod,
  paymentStatus: o.paymentStatus,
  total: n(o.total),
  due: n(o.dueAmount),
  placedAt: o.placedAt,
  slot: o.deliverySlot,
  distanceKm: o.deliveryDistanceKm === null ? null : n(o.deliveryDistanceKm),
  customerName:
    o.shippingAddress?.fullName ?? o.user?.name ?? o.guestName ?? 'Customer',
  phone: o.shippingAddress?.phone ?? o.user?.phone ?? o.guestPhone ?? null,
  address: o.shippingAddress?.line1 ?? null,
  landmark: o.deliveryLandmark ?? o.shippingAddress?.landmark ?? null,
  placeName: o.deliveryPlaceName ?? o.shippingAddress?.placeName ?? null,
  lat: o.deliveryLat ?? o.shippingAddress?.latitude ?? null,
  lng: o.deliveryLng ?? o.shippingAddress?.longitude ?? null,
  deliveryNote: o.deliveryNote,
  customerNote: o.customerNote,
});

@Injectable()
export class DeliveriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly orders: AdminOrdersService,
    private readonly activity: ActivityLogService,
  ) {}

  private log(
    actor: User,
    action: string,
    summary: string,
    delivery: { id: string },
    order: { orderNumber: string },
    extra?: Record<string, unknown>,
  ) {
    this.activity.record({
      actorType: 'ADMIN',
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      action,
      category: 'delivery',
      summary,
      entityType: 'delivery',
      entityId: delivery.id,
      entityLabel: order.orderNumber,
      metadata: extra as never,
    });
  }

  // ------------------------------------------------------------------ the board

  async board(q: BoardQueryDto) {
    const day = parseDay(q.date, startOfDay(new Date()));
    const next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
    const who = q.assigneeId ? { assigneeId: q.assigneeId } : {};
    const deliveryInclude = {
      assignee: { select: { id: true, name: true, phone: true } },
      order: { select: orderCard },
    } satisfies Prisma.DeliveryInclude;

    const [unassigned, working, delivered, failed] = await Promise.all([
      q.assigneeId
        ? Promise.resolve([] as CardOrder[])
        : this.prisma.order.findMany({
            where: {
              status: { in: ['CONFIRMED', 'PROCESSING', 'ON_HOLD'] },
              shippingAddressId: { not: null },
              OR: [{ delivery: null }, { delivery: { status: 'CANCELLED' } }],
            },
            select: orderCard,
            orderBy: { placedAt: 'asc' },
            take: 100,
          }),
      this.prisma.delivery.findMany({
        where: { status: { in: ACTIVE_DELIVERY }, ...who },
        include: deliveryInclude,
        orderBy: { assignedAt: 'asc' },
        take: 200,
      }),
      this.prisma.delivery.findMany({
        where: {
          status: 'DELIVERED',
          deliveredAt: { gte: day, lt: next },
          ...who,
        },
        include: deliveryInclude,
        orderBy: { deliveredAt: 'desc' },
        take: 200,
      }),
      this.prisma.delivery.findMany({
        where: { status: 'FAILED', ...who },
        include: deliveryInclude,
        orderBy: { failedAt: 'desc' },
        take: 100,
      }),
    ]);

    const asCard = (d: (typeof working)[number]) => ({
      delivery: {
        id: d.id,
        status: d.status,
        attempts: d.attempts,
        assignedAt: d.assignedAt,
        pickedUpAt: d.pickedUpAt,
        onTheWayAt: d.onTheWayAt,
        deliveredAt: d.deliveredAt,
        failedAt: d.failedAt,
        failedReason: d.failedReason,
        cashToCollect: n(d.cashToCollect),
        cashCollected: d.cashCollected === null ? null : n(d.cashCollected),
        cashHandedOverAt: d.cashHandedOverAt,
        assignee: d.assignee,
      },
      order: card(d.order),
    });

    return {
      date: dayKey(day),
      columns: {
        unassigned: unassigned.map((o) => ({ delivery: null, order: card(o) })),
        assigned: working.filter((d) => d.status !== 'ON_THE_WAY').map(asCard),
        onTheWay: working.filter((d) => d.status === 'ON_THE_WAY').map(asCard),
        delivered: delivered.map(asCard),
        failed: failed.map(asCard),
      },
    };
  }

  /** Everyone who can be given a delivery. An admin or a manager with "can deliver" is in the list too. */
  async riders() {
    const people = await this.prisma.user.findMany({
      where: {
        canDeliver: true,
        status: 'ACTIVE',
        role: { in: ['STAFF', 'ADMIN', 'SUPER_ADMIN'] },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        staffTitle: true,
        role: true,
      },
      orderBy: { name: 'asc' },
    });
    if (!people.length) return [];
    const ids = people.map((p) => p.id);
    const today = startOfDay(new Date());
    const [active, doneToday, cash] = await Promise.all([
      this.prisma.delivery.groupBy({
        by: ['assigneeId'],
        where: { assigneeId: { in: ids }, status: { in: ACTIVE_DELIVERY } },
        _count: true,
      }),
      this.prisma.delivery.groupBy({
        by: ['assigneeId'],
        where: {
          assigneeId: { in: ids },
          status: 'DELIVERED',
          deliveredAt: { gte: today },
        },
        _count: true,
      }),
      this.prisma.delivery.groupBy({
        by: ['assigneeId'],
        where: {
          assigneeId: { in: ids },
          status: 'DELIVERED',
          cashHandedOverAt: null,
          cashCollected: { gt: 0 },
        },
        _sum: { cashCollected: true },
      }),
    ]);
    const by = <T extends { assigneeId: string }>(rows: T[]) =>
      new Map(rows.map((r) => [r.assigneeId, r]));
    const a = by(active);
    const d = by(doneToday);
    const c = by(cash);
    return people.map((p) => ({
      ...p,
      active: a.get(p.id)?._count ?? 0,
      deliveredToday: d.get(p.id)?._count ?? 0,
      cashInHand: n(c.get(p.id)?._sum.cashCollected),
    }));
  }

  // ------------------------------------------------------------------ assigning

  async assign(
    orderIds: string[],
    assigneeId: string,
    actor: User,
    note?: string,
  ) {
    const assignee = await this.prisma.user.findUnique({
      where: { id: assigneeId },
      select: {
        id: true,
        name: true,
        canDeliver: true,
        status: true,
        role: true,
      },
    });
    if (
      !assignee ||
      assignee.status !== 'ACTIVE' ||
      !assignee.canDeliver ||
      assignee.role === 'USER'
    ) {
      throw new BadRequestException(
        'That person cannot be given deliveries. Switch on "Can deliver" in their staff profile.',
      );
    }
    const results: {
      orderId: string;
      orderNumber?: string;
      ok: boolean;
      error?: string;
    }[] = [];
    for (const orderId of [...new Set(orderIds)]) {
      try {
        const order = await this.assignOne(orderId, assignee, actor, note);
        results.push({ orderId, orderNumber: order.orderNumber, ok: true });
      } catch (e) {
        results.push({
          orderId,
          ok: false,
          error: e instanceof Error ? e.message : 'Failed',
        });
      }
    }
    return {
      assigned: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    };
  }

  private async assignOne(
    orderId: string,
    assignee: { id: string; name: string },
    actor: User,
    note?: string,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentMethod: true,
        total: true,
        paidAmount: true,
        userId: true,
        guestPhone: true,
        shippingAddressId: true,
        deliveryDistanceKm: true,
        shippingAddress: { select: { phone: true } },
        delivery: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (!order.shippingAddressId)
      throw new BadRequestException(
        `${order.orderNumber}: a walk-in sale has nothing to deliver`,
      );
    if (order.status === 'PENDING')
      throw new BadRequestException(
        `${order.orderNumber}: confirm the order first`,
      );
    if (!ASSIGNABLE.includes(order.status))
      throw new BadRequestException(
        `${order.orderNumber}: a ${order.status.toLowerCase().replace('_', ' ')} order cannot be given to a rider`,
      );

    const phone = order.shippingAddress?.phone ?? order.guestPhone ?? '';
    const customerKey =
      order.userId ?? (phone ? normalizeBdPhone(phone) : order.id);
    const due =
      order.paymentMethod === 'CASH_ON_DELIVERY'
        ? Math.max(0, n(order.total) - n(order.paidAmount))
        : 0;
    const existing = order.delivery;

    if (
      existing &&
      ACTIVE_DELIVERY.includes(existing.status) &&
      existing.assigneeId === assignee.id
    ) {
      throw new BadRequestException(
        `${order.orderNumber} is already with ${assignee.name}`,
      );
    }
    if (existing?.status === 'DELIVERED')
      throw new BadRequestException(
        `${order.orderNumber} was already delivered`,
      );

    const reassigned = !!existing && ACTIVE_DELIVERY.includes(existing.status);
    const retry = !!existing && !reassigned; // an earlier try failed or was taken back
    const now = new Date();
    const delivery = await this.prisma.$transaction(async (tx) => {
      const data = {
        assigneeId: assignee.id,
        assignedById: actor.id,
        status: 'ASSIGNED' as DeliveryStatus,
        assignedAt: now,
        acceptedAt: null,
        pickedUpAt: null,
        onTheWayAt: null,
        deliveredAt: null,
        failedAt: null,
        failedReason: null,
        cashToCollect: due,
        cashCollected: null,
        distanceKm: order.deliveryDistanceKm,
        note: note ?? null,
      };
      const saved = existing
        ? await tx.delivery.update({
            where: { id: existing.id },
            data: { ...data, attempts: retry ? { increment: 1 } : undefined },
          })
        : await tx.delivery.create({ data: { ...data, orderId, customerKey } });
      await tx.deliveryEvent.create({
        data: {
          deliveryId: saved.id,
          status: 'ASSIGNED',
          actorId: actor.id,
          actorName: actor.name,
          note: reassigned
            ? `Moved to ${assignee.name}${note ? `: ${note}` : ''}`
            : `Given to ${assignee.name}${note ? `: ${note}` : ''}`,
        },
      });
      await writeAudit(tx, {
        adminId: actor.id,
        action: 'DELIVERY_ASSIGNED',
        entity: 'Order',
        entityId: orderId,
        oldValue: existing
          ? { assignee: existing.assigneeId, status: existing.status }
          : null,
        newValue: { orderNumber: order.orderNumber, assignee: assignee.name },
      });
      return saved;
    });
    this.log(
      actor,
      reassigned ? 'delivery.reassigned' : 'delivery.assigned',
      `${actor.name} gave ${order.orderNumber} to ${assignee.name}`,
      delivery,
      order,
      { assigneeId: assignee.id },
    );
    return order;
  }

  async unassign(id: string, actor: User, note?: string) {
    const d = await this.prisma.delivery.findUnique({
      where: { id },
      include: {
        order: { select: { orderNumber: true } },
        assignee: { select: { name: true } },
      },
    });
    if (!d) throw new NotFoundException('Delivery not found');
    if (!ACTIVE_DELIVERY.includes(d.status))
      throw new BadRequestException('This delivery is already finished');
    await this.prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
      await tx.deliveryEvent.create({
        data: {
          deliveryId: id,
          status: 'CANCELLED',
          actorId: actor.id,
          actorName: actor.name,
          note: `Taken back from ${d.assignee.name}${note ? `: ${note}` : ''}`,
        },
      });
      await writeAudit(tx, {
        adminId: actor.id,
        action: 'DELIVERY_UNASSIGNED',
        entity: 'Order',
        entityId: d.orderId,
        oldValue: { assignee: d.assignee.name },
        newValue: { orderNumber: d.order.orderNumber },
      });
    });
    this.log(
      actor,
      'delivery.unassigned',
      `${actor.name} took ${d.order.orderNumber} back from ${d.assignee.name}`,
      d,
      d.order,
    );
    return { success: true };
  }

  async findOne(id: string) {
    const d = await this.prisma.delivery.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, phone: true } },
        assigner: { select: { id: true, name: true } },
        events: { orderBy: { createdAt: 'asc' } },
        order: { select: orderCard },
      },
    });
    if (!d) throw new NotFoundException('Delivery not found');
    return {
      ...d,
      order: card(d.order),
      cashToCollect: n(d.cashToCollect),
      cashCollected: d.cashCollected === null ? null : n(d.cashCollected),
    };
  }

  // ------------------------------------------------------------------ the rider

  private assertDeliverer(me: User) {
    if (!me.canDeliver)
      throw new ForbiddenException(
        'Your account is not set up to deliver. Ask the shop to switch on "Can deliver".',
      );
  }

  async mine(me: User, scope: 'active' | 'done') {
    this.assertDeliverer(me);
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const rows = await this.prisma.delivery.findMany({
      where:
        scope === 'active'
          ? { assigneeId: me.id, status: { in: ACTIVE_DELIVERY } }
          : {
              assigneeId: me.id,
              status: { in: ['DELIVERED', 'FAILED'] },
              updatedAt: { gte: since },
            },
      include: {
        order: {
          select: {
            ...orderCard,
            items: {
              select: {
                id: true,
                productName: true,
                productNameBn: true,
                quantity: true,
                unitLabel: true,
                unitLabelBn: true,
                finalQty: true,
              },
            },
          },
        },
      },
      orderBy:
        scope === 'active' ? { assignedAt: 'asc' } : { updatedAt: 'desc' },
      take: 100,
    });
    return rows.map((d) => ({
      id: d.id,
      status: d.status,
      attempts: d.attempts,
      note: d.note,
      assignedAt: d.assignedAt,
      deliveredAt: d.deliveredAt,
      failedAt: d.failedAt,
      failedReason: d.failedReason,
      cashToCollect: n(d.cashToCollect),
      cashCollected: d.cashCollected === null ? null : n(d.cashCollected),
      cashHandedOverAt: d.cashHandedOverAt,
      order: {
        ...card(d.order),
        items: d.order.items.map((i) => ({
          id: i.id,
          name: i.productName,
          nameBn: i.productNameBn,
          quantity: n(i.finalQty ?? i.quantity),
          unit: i.unitLabel,
          unitBn: i.unitLabelBn,
        })),
      },
    }));
  }

  async mySummary(me: User) {
    this.assertDeliverer(me);
    const today = startOfDay(new Date());
    const [active, done, failed, cash] = await Promise.all([
      this.prisma.delivery.count({
        where: { assigneeId: me.id, status: { in: ACTIVE_DELIVERY } },
      }),
      this.prisma.delivery.count({
        where: {
          assigneeId: me.id,
          status: 'DELIVERED',
          deliveredAt: { gte: today },
        },
      }),
      this.prisma.delivery.count({
        where: {
          assigneeId: me.id,
          status: 'FAILED',
          failedAt: { gte: today },
        },
      }),
      this.prisma.delivery.aggregate({
        where: {
          assigneeId: me.id,
          status: 'DELIVERED',
          cashHandedOverAt: null,
          cashCollected: { gt: 0 },
        },
        _sum: { cashCollected: true },
      }),
    ]);
    return {
      active,
      deliveredToday: done,
      failedToday: failed,
      cashInHand: n(cash._sum.cashCollected),
    };
  }

  /**
   * One step of a delivery by the rider. The order status follows (and the customer is told):
   * picked up -> Shipped, on the way -> Out for delivery, delivered -> Delivered (cash on delivery is recorded as paid),
   * failed -> On hold for the shop to decide.
   */
  async step(
    id: string,
    me: User,
    to: DeliveryStatus,
    input: {
      note?: string;
      cashCollected?: number;
      reason?: (typeof FAIL_REASONS)[number];
    },
  ) {
    this.assertDeliverer(me);
    const d = await this.prisma.delivery.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentMethod: true,
            total: true,
            paidAmount: true,
          },
        },
      },
    });
    if (!d || d.assigneeId !== me.id)
      throw new NotFoundException('Delivery not found');
    if (!ACTIVE_DELIVERY.includes(d.status))
      throw new BadRequestException('This delivery is already finished');
    if (d.order.status === 'CANCELLED')
      throw new BadRequestException('This order was cancelled');
    if (d.status === to) throw new BadRequestException('Already done');
    if (to === 'ACCEPTED' && d.status !== 'ASSIGNED')
      throw new BadRequestException('Already accepted');
    if (to === 'PICKED_UP' && !['ASSIGNED', 'ACCEPTED'].includes(d.status))
      throw new BadRequestException('The parcel was already picked up');
    if (
      to === 'ON_THE_WAY' &&
      !['ASSIGNED', 'ACCEPTED', 'PICKED_UP'].includes(d.status)
    )
      throw new BadRequestException('Already on the way');

    const now = new Date();
    const due =
      d.order.paymentMethod === 'CASH_ON_DELIVERY'
        ? Math.max(0, n(d.order.total) - n(d.order.paidAmount))
        : 0;
    const cash = to === 'DELIVERED' ? round2(input.cashCollected ?? due) : null;
    const reasonText = input.reason ? REASON_LABEL[input.reason] : null;
    const eventNote =
      to === 'FAILED'
        ? `${reasonText}${input.note ? `: ${input.note}` : ''}`
        : to === 'DELIVERED' && due > 0
          ? `Cash taken ${cash}${cash !== due ? ` (due ${due})` : ''}${input.note ? `. ${input.note}` : ''}`
          : (input.note ?? null);

    // the delivery first, so that the order change below does not race with it
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.delivery.updateMany({
        where: { id, status: d.status },
        data: {
          status: to,
          ...(to === 'ACCEPTED' ? { acceptedAt: now } : {}),
          ...(to === 'PICKED_UP'
            ? { pickedUpAt: now, acceptedAt: d.acceptedAt ?? now }
            : {}),
          ...(to === 'ON_THE_WAY'
            ? { onTheWayAt: now, acceptedAt: d.acceptedAt ?? now }
            : {}),
          ...(to === 'DELIVERED'
            ? { deliveredAt: now, cashCollected: cash, cashToCollect: due }
            : {}),
          ...(to === 'FAILED'
            ? { failedAt: now, failedReason: input.reason ?? 'OTHER' }
            : {}),
        },
      });
      if (claimed.count === 0)
        throw new BadRequestException(
          'This delivery was just changed. Refresh and try again.',
        );
      await tx.deliveryEvent.create({
        data: {
          deliveryId: id,
          status: to,
          actorId: me.id,
          actorName: me.name,
          note: eventNote,
        },
      });
      if (to === 'DELIVERED' || to === 'FAILED') {
        const action: AuditAction =
          to === 'DELIVERED' ? 'DELIVERY_COMPLETED' : 'DELIVERY_FAILED';
        await writeAudit(tx, {
          adminId: me.id,
          action,
          entity: 'Order',
          entityId: d.order.id,
          newValue: {
            orderNumber: d.order.orderNumber,
            cash,
            reason: reasonText,
            note: input.note,
          },
        });
      }
    });

    // the order follows; a problem here must not undo the rider's step
    const target: Partial<
      Record<
        DeliveryStatus,
        { status: OrderStatus; from: OrderStatus[]; note: string }
      >
    > = {
      PICKED_UP: {
        status: 'SHIPPED',
        from: ['CONFIRMED', 'PROCESSING', 'ON_HOLD'],
        note: `Picked up by ${me.name}`,
      },
      ON_THE_WAY: {
        status: 'OUT_FOR_DELIVERY',
        from: ['CONFIRMED', 'PROCESSING', 'ON_HOLD', 'SHIPPED', 'IN_TRANSIT'],
        note: `${me.name} is on the way`,
      },
      DELIVERED: {
        status: 'DELIVERED',
        from: [
          'CONFIRMED',
          'PROCESSING',
          'ON_HOLD',
          'SHIPPED',
          'IN_TRANSIT',
          'OUT_FOR_DELIVERY',
        ],
        note: `Delivered by ${me.name}`,
      },
      FAILED: {
        status: 'ON_HOLD',
        from: [
          'CONFIRMED',
          'PROCESSING',
          'SHIPPED',
          'IN_TRANSIT',
          'OUT_FOR_DELIVERY',
        ],
        note: `Delivery failed (${reasonText}), ${me.name}`,
      },
    };
    const t = target[to];
    if (t && t.from.includes(d.order.status)) {
      try {
        await this.orders.updateStatus(d.order.id, t.status, t.note, me.id);
      } catch {
        /* the delivery is saved; the shop can fix the order status by hand */
      }
    }

    const verb: Record<DeliveryStatus, string> = {
      ASSIGNED: 'was given',
      ACCEPTED: 'accepted',
      PICKED_UP: 'picked up',
      ON_THE_WAY: 'is on the way with',
      DELIVERED: 'delivered',
      FAILED: 'could not deliver',
      CANCELLED: 'cancelled',
    };
    this.log(
      me,
      `delivery.${to.toLowerCase()}`,
      `${me.name} ${verb[to]} ${d.order.orderNumber}${to === 'FAILED' ? ` (${reasonText})` : to === 'DELIVERED' && due > 0 ? `, cash ${cash}` : ''}`,
      d,
      d.order,
      { cashCollected: cash, reason: input.reason },
    );
    return { success: true, status: to };
  }

  // ------------------------------------------------------------------ cash

  async cashByRider() {
    const rows = await this.prisma.delivery.findMany({
      where: {
        status: 'DELIVERED',
        cashHandedOverAt: null,
        cashCollected: { gt: 0 },
      },
      select: {
        id: true,
        assigneeId: true,
        cashCollected: true,
        cashToCollect: true,
        deliveredAt: true,
        assignee: { select: { id: true, name: true, phone: true } },
        order: { select: { orderNumber: true } },
      },
      orderBy: { deliveredAt: 'asc' },
      take: 1000,
    });
    const by = new Map<
      string,
      {
        rider: { id: string; name: string; phone: string };
        total: number;
        items: {
          id: string;
          orderNumber: string;
          cash: number;
          due: number;
          deliveredAt: Date | null;
        }[];
      }
    >();
    for (const r of rows) {
      const g = by.get(r.assigneeId) ?? {
        rider: r.assignee,
        total: 0,
        items: [],
      };
      g.total = round2(g.total + n(r.cashCollected));
      g.items.push({
        id: r.id,
        orderNumber: r.order.orderNumber,
        cash: n(r.cashCollected),
        due: n(r.cashToCollect),
        deliveredAt: r.deliveredAt,
      });
      by.set(r.assigneeId, g);
    }
    return [...by.values()].sort((a, b) => b.total - a.total);
  }

  async handOver(ids: string[], actor: User) {
    const rows = await this.prisma.delivery.findMany({
      where: {
        id: { in: ids },
        status: 'DELIVERED',
        cashHandedOverAt: null,
        cashCollected: { gt: 0 },
      },
      select: {
        id: true,
        cashCollected: true,
        assigneeId: true,
        assignee: { select: { name: true } },
        order: { select: { orderNumber: true } },
      },
    });
    if (!rows.length)
      throw new BadRequestException(
        'Nothing to hand over: the cash was already received, or no cash was taken',
      );
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.delivery.updateMany({
        where: { id: { in: rows.map((r) => r.id) } },
        data: { cashHandedOverAt: now, cashHandedOverById: actor.id },
      });
      await tx.deliveryEvent.createMany({
        data: rows.map((r) => ({
          deliveryId: r.id,
          status: 'DELIVERED' as const,
          actorId: actor.id,
          actorName: actor.name,
          note: `Cash ${n(r.cashCollected)} received by ${actor.name}`,
        })),
      });
      await writeAudit(tx, {
        adminId: actor.id,
        action: 'CASH_HANDED_OVER',
        entity: 'Delivery',
        entityId: rows[0].id,
        newValue: {
          deliveries: rows.length,
          total: round2(rows.reduce((s, r) => s + n(r.cashCollected), 0)),
          riders: [...new Set(rows.map((r) => r.assignee.name))],
        },
      });
    });
    const total = round2(rows.reduce((s, r) => s + n(r.cashCollected), 0));
    this.activity.record({
      actorType: 'ADMIN',
      actorId: actor.id,
      actorName: actor.name,
      actorEmail: actor.email,
      action: 'delivery.cash_handed_over',
      category: 'delivery',
      summary: `${actor.name} received ৳${total} cash from ${[...new Set(rows.map((r) => r.assignee.name))].join(', ')} (${rows.length} deliveries)`,
      entityType: 'delivery',
      entityId: rows[0].id,
    });
    return { received: rows.length, total };
  }

  // ------------------------------------------------------------------ statistics

  async stats(q: RangeDto) {
    const today = startOfDay(new Date());
    const to = q.to ? parseDay(q.to, today) : today;
    const toEnd = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);
    const from = q.from
      ? parseDay(q.from, today)
      : new Date(to.getFullYear(), to.getMonth(), to.getDate() - 29);

    const [
      allDelivered,
      allCustomers,
      inRange,
      failedInRange,
      activeNow,
      pendingToday,
      withRiders,
      toCollect,
    ] = await Promise.all([
      this.prisma.delivery.count({ where: { status: 'DELIVERED' } }),
      this.prisma.delivery.findMany({
        where: { status: 'DELIVERED' },
        distinct: ['customerKey'],
        select: { customerKey: true },
      }),
      this.prisma.delivery.findMany({
        where: { status: 'DELIVERED', deliveredAt: { gte: from, lt: toEnd } },
        select: {
          id: true,
          customerKey: true,
          assigneeId: true,
          assignedAt: true,
          deliveredAt: true,
          order: { select: { placedAt: true } },
          assignee: { select: { name: true } },
        },
        take: 10000,
      }),
      this.prisma.delivery.groupBy({
        by: ['assigneeId'],
        where: { status: 'FAILED', failedAt: { gte: from, lt: toEnd } },
        _count: true,
      }),
      this.prisma.delivery.count({
        where: { status: { in: ACTIVE_DELIVERY } },
      }),
      this.prisma.order.count({
        where: {
          status: {
            in: [
              'CONFIRMED',
              'PROCESSING',
              'SHIPPED',
              'IN_TRANSIT',
              'OUT_FOR_DELIVERY',
              'ON_HOLD',
            ],
          },
          shippingAddressId: { not: null },
        },
      }),
      this.prisma.delivery.aggregate({
        where: {
          status: 'DELIVERED',
          cashHandedOverAt: null,
          cashCollected: { gt: 0 },
        },
        _sum: { cashCollected: true },
      }),
      this.prisma.delivery.aggregate({
        where: { status: { in: ACTIVE_DELIVERY } },
        _sum: { cashToCollect: true },
      }),
    ]);

    // customers in this range who also had an earlier delivery (or more than one in the range)
    const keys = [...new Set(inRange.map((r) => r.customerKey))];
    const counts = keys.length
      ? await this.prisma.delivery.groupBy({
          by: ['customerKey'],
          where: { status: 'DELIVERED', customerKey: { in: keys } },
          _count: true,
        })
      : [];
    const repeat = counts.filter((c) => c._count >= 2).length;

    const mins = (r: (typeof inRange)[number]) =>
      r.deliveredAt
        ? (r.deliveredAt.getTime() - r.order.placedAt.getTime()) / 60000
        : null;
    const fromAssign = (r: (typeof inRange)[number]) =>
      r.deliveredAt
        ? (r.deliveredAt.getTime() - r.assignedAt.getTime()) / 60000
        : null;
    const avg = (xs: (number | null)[]) => {
      const v = xs.filter((x): x is number => x !== null && x >= 0);
      return v.length
        ? Math.round(v.reduce((s, x) => s + x, 0) / v.length)
        : null;
    };

    const failedBy = new Map(
      failedInRange.map((f) => [f.assigneeId, f._count]),
    );
    const riders = new Map<
      string,
      {
        id: string;
        name: string;
        delivered: number;
        failed: number;
        minutes: (number | null)[];
      }
    >();
    for (const r of inRange) {
      const g = riders.get(r.assigneeId) ?? {
        id: r.assigneeId,
        name: r.assignee.name,
        delivered: 0,
        failed: failedBy.get(r.assigneeId) ?? 0,
        minutes: [],
      };
      g.delivered++;
      g.minutes.push(fromAssign(r));
      riders.set(r.assigneeId, g);
    }
    const series = new Map<string, number>();
    for (
      let d = new Date(from);
      d < toEnd;
      d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
    )
      series.set(dayKey(d), 0);
    for (const r of inRange)
      if (r.deliveredAt)
        series.set(
          dayKey(r.deliveredAt),
          (series.get(dayKey(r.deliveredAt)) ?? 0) + 1,
        );

    const failedTotal = failedInRange.reduce((s, f) => s + f._count, 0);
    return {
      from: dayKey(from),
      to: dayKey(to),
      totals: {
        deliveries: allDelivered,
        uniqueCustomers: allCustomers.length,
      },
      range: {
        delivered: inRange.length,
        failed: failedTotal,
        successRatePct:
          inRange.length + failedTotal
            ? Math.round(
                (inRange.length / (inRange.length + failedTotal)) * 100,
              )
            : null,
        uniqueCustomers: keys.length,
        repeatCustomers: repeat,
        repeatCustomerPct: keys.length
          ? Math.round((repeat / keys.length) * 100)
          : null,
        avgMinutesFromOrder: avg(inRange.map(mins)),
        avgMinutesFromAssign: avg(inRange.map(fromAssign)),
      },
      now: {
        withRiders: activeNow,
        waitingForDelivery: pendingToday,
        cashWithRiders: n(withRiders._sum.cashCollected),
        cashToCollect: n(toCollect._sum.cashToCollect),
      },
      riders: [...riders.values()]
        .map((r) => ({
          id: r.id,
          name: r.name,
          delivered: r.delivered,
          failed: r.failed,
          avgMinutes: avg(r.minutes),
        }))
        .sort((a, b) => b.delivered - a.delivered),
      series: [...series.entries()].map(([date, delivered]) => ({
        date,
        delivered,
      })),
    };
  }

  // ------------------------------------------------------------------ rider settlements

  async listSettlements(q: ListSettlementsDto) {
    const where: Prisma.RiderSettlementWhereInput = {
      ...(q.riderId ? { riderId: q.riderId } : {}),
      ...(q.status ? { status: q.status } : {}),
      ...(q.from || q.to
        ? {
            date: {
              ...(q.from ? { gte: new Date(q.from) } : {}),
              ...(q.to ? { lte: new Date(q.to) } : {}),
            },
          }
        : {}),
    };
    const page = q.page || 1;
    const limit = q.limit || 20;

    const [data, total] = await Promise.all([
      this.prisma.riderSettlement.findMany({
        where,
        include: {
          rider: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.riderSettlement.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createSettlement(dto: CreateSettlementDto, adminId: string) {
    const unhandedDeliveries = await this.prisma.delivery.findMany({
      where: {
        assigneeId: dto.riderId,
        status: 'DELIVERED',
        cashHandedOverAt: null,
        cashCollected: { gt: 0 },
      },
      select: { id: true, cashCollected: true },
    });

    const totalCash = round2(
      unhandedDeliveries.reduce(
        (sum, d) => sum + Number(d.cashCollected ?? 0),
        0,
      ),
    );

    const settlement = await this.prisma.riderSettlement.create({
      data: {
        riderId: dto.riderId,
        date: dto.date ? new Date(dto.date) : new Date(),
        orderCount: unhandedDeliveries.length,
        totalCashCollected: totalCash,
        settledAmount: 0,
        status: 'PENDING',
        notes: dto.notes ?? null,
      },
      include: {
        rider: { select: { id: true, name: true, phone: true } },
      },
    });

    return settlement;
  }

  async settleSettlement(
    id: string,
    dto: SettleSettlementDto,
    actor: User,
  ) {
    const settlement = await this.prisma.riderSettlement.findUnique({
      where: { id },
      include: { rider: true },
    });
    if (!settlement) {
      throw new NotFoundException('Settlement record not found');
    }
    if (settlement.status === 'SETTLED') {
      throw new BadRequestException('This settlement has already been settled.');
    }

    const unhanded = await this.prisma.delivery.findMany({
      where: {
        assigneeId: settlement.riderId,
        status: 'DELIVERED',
        cashHandedOverAt: null,
        cashCollected: { gt: 0 },
      },
      select: { id: true, cashCollected: true },
    });

    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.riderSettlement.update({
        where: { id },
        data: {
          status: 'SETTLED',
          settledAmount: dto.settledAmount,
          settledAt: now,
          receivedByAdminId: actor.id,
          notes: dto.notes ?? settlement.notes,
        },
      });

      if (unhanded.length > 0) {
        await tx.delivery.updateMany({
          where: { id: { in: unhanded.map((d) => d.id) } },
          data: {
            cashHandedOverAt: now,
            cashHandedOverById: actor.id,
          },
        });

        await tx.deliveryEvent.createMany({
          data: unhanded.map((d) => ({
            deliveryId: d.id,
            status: 'DELIVERED' as const,
            actorId: actor.id,
            actorName: actor.name,
            note: `Settled via settlement #${id}: ৳${dto.settledAmount} received by ${actor.name}`,
          })),
        });
      }

      await writeAudit(tx, {
        adminId: actor.id,
        action: 'CASH_HANDED_OVER',
        entity: 'Delivery',
        entityId: id,
        newValue: {
          settlementId: id,
          rider: settlement.rider.name,
          settledAmount: dto.settledAmount,
          ordersCount: unhanded.length,
        },
      });
    });

    return { success: true, message: 'Settlement confirmed successfully' };
  }
}
