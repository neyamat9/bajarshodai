import type { DeliveryStatus, OrderStatus, Prisma } from '@prisma/client';

type Db =
  | Prisma.TransactionClient
  | import('../../prisma/prisma.service').PrismaService;

export const ACTIVE_DELIVERY: DeliveryStatus[] = [
  'ASSIGNED',
  'ACCEPTED',
  'PICKED_UP',
  'ON_THE_WAY',
];

/**
 * When someone changes an order directly (not through the rider), its delivery must follow:
 * marked delivered -> the delivery is delivered, cancelled -> the delivery is cancelled.
 * Other order statuses leave the delivery alone.
 */
export async function syncDeliveryWithOrder(
  db: Db,
  orderId: string,
  status: OrderStatus,
  actor: { id: string; name: string } | null,
) {
  const next: DeliveryStatus | null =
    status === 'DELIVERED'
      ? 'DELIVERED'
      : status === 'CANCELLED' || status === 'RETURNED' || status === 'REFUNDED'
        ? 'CANCELLED'
        : null;
  if (!next) return;
  const delivery = await db.delivery.findUnique({
    where: { orderId },
    select: { id: true, status: true },
  });
  if (!delivery || !ACTIVE_DELIVERY.includes(delivery.status)) return;
  const now = new Date();
  await db.delivery.update({
    where: { id: delivery.id },
    data: {
      status: next,
      ...(next === 'DELIVERED' ? { deliveredAt: now } : {}),
    },
  });
  await db.deliveryEvent.create({
    data: {
      deliveryId: delivery.id,
      status: next,
      actorId: actor?.id ?? null,
      actorName: actor?.name ?? null,
      note:
        next === 'DELIVERED'
          ? 'The order was marked delivered'
          : `The order was ${status.toLowerCase()}`,
    },
  });
}
