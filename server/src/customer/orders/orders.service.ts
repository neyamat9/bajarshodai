import { randomBytes } from 'crypto';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import {
  isMobileBanking,
  PAYMENT_LABEL,
  DeliverySettings,
} from '../../common/settings/settings.types';
import { SettingsService } from '../../common/settings';
import { PrismaService } from '../../prisma/prisma.service';
import { PlaceOrderDto } from './dto/place-order.dto';
import { CheckoutService } from '../checkout/checkout.service';
import { CouponsService } from '../coupons/coupons.service';
import {
  cancelOrderAndRestore,
  nextOrderNumber,
} from '../../common/orders/order-lifecycle';
import { OrderStatus } from '@prisma/client';
import { CartOwner } from '../../common/cart/cart-owner';
import { OrderNotifierService } from '../../common/notifications';
import { LocationsService } from '../../common/locations';
import { CartService } from '../cart/cart.service';
import { InsufficientStockError, StockService } from '../../common/inventory';
import { normalizeBdPhone } from '../../common/utils/phone';
import { toNum } from '../../common/utils/qty';
import { round2 } from '../shipping/shipping.service';
import { LoyaltyService } from '../loyalty/loyalty.service';

// Customers can cancel until the order has been handed to the courier.
const CUSTOMER_CANCELLABLE: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
];

// What a customer may see of an order: never the staff / internal notes or
// which admin created it.
export function toCustomerOrder<
  T extends {
    internalNote?: unknown;
    staffNote?: unknown;
    createdByAdminId?: unknown;
    shippingMethodId?: unknown;
    statusHistory?: { changedBy?: unknown }[];
  },
>(o: T) {
  const {
    internalNote: _internalNote,
    staffNote: _staffNote,
    createdByAdminId: _createdByAdminId,
    shippingMethodId: _shippingMethodId,
    statusHistory,
    ...rest
  } = o;
  void _internalNote;
  void _staffNote;
  void _createdByAdminId;
  void _shippingMethodId;
  const token = (rest as any).locationToken;
  const frontendUrl = (process.env.FRONTEND_URL || 'https://bazarshodai.com').replace(/\/+$/, '');
  return {
    ...rest,
    locationUrl: token ? `${frontendUrl}/l/${token}` : null,
    ...(statusHistory
      ? {
          statusHistory: statusHistory.map((h) => {
            const { changedBy: _changedBy, ...h2 } = h;
            void _changedBy;
            return h2;
          }),
        }
      : {}),
  };
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private checkoutService: CheckoutService,
    private couponsService: CouponsService,
    private notifier: OrderNotifierService,
    private locations: LocationsService,
    private cartService: CartService,
    private stock: StockService,
    private loyaltyService: LoyaltyService,
    private settings: SettingsService,
  ) {}

  async findAll(userId: string) {
    const rows = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        shippingAddress: true,
      },
      orderBy: { placedAt: 'desc' },
    });
    return rows.map(toCustomerOrder);
  }

  async findById(userId: string | null, orderId: string) {
    const where = userId ? { id: orderId, userId } : { id: orderId, userId: null };
    const order = await this.prisma.order.findFirst({
      where,
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        shippingAddress: true,
        payments: true,
        delivery: {
          select: {
            status: true,
            assignee: { select: { name: true, phone: true } },
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    // Once the parcel is with the rider the customer may call them
    const d = order.delivery;
    const rider =
      d && (d.status === 'PICKED_UP' || d.status === 'ON_THE_WAY')
        ? { name: d.assignee.name, phone: d.assignee.phone, status: d.status }
        : null;
    return { ...toCustomerOrder(order), rider };
  }

  // Places an order from the cart of a logged-in customer or a guest.
  async placeOrder(owner: CartOwner, dto: PlaceOrderDto) {
    const userId = owner.userId ?? null;
    const phone = normalizeBdPhone(dto.shippingAddress.phone);
    const { division, district, upazila } = dto.shippingAddress;
    const area = this.locations.resolve({ division, district, upazila });
    // The delivery is priced from the pin; the district fields are optional and only describe the place.
    const city =
      dto.shippingAddress.city?.trim() ||
      area.district ||
      dto.shippingAddress.placeName?.split(',').pop()?.trim() ||
      'Shahrasti';
    const guestEmail = userId ? null : dto.email?.trim().toLowerCase() || null;

    const paymentMethods = await this.checkoutService.enabledPaymentMethods();
    if (!paymentMethods.includes(dto.paymentMethod)) {
      throw new BadRequestException(
        `${PAYMENT_LABEL[dto.paymentMethod] ?? 'This payment method'} is not available right now`,
      );
    }

    // COD blacklist enforcement (account flag and blacklisted phones)
    if (dto.paymentMethod === 'CASH_ON_DELIVERY') {
      if (userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          select: { isBlacklisted: true },
        });
        if (user?.isBlacklisted) {
          throw new BadRequestException(
            'Cash on Delivery is unavailable for this account. Please select bKash or Nagad payment.',
          );
        }
      }
      const blacklistedPhone = await this.prisma.blacklistedPhone.findUnique({
        where: { phone },
      });
      if (blacklistedPhone) {
        throw new BadRequestException(
          'Cash on Delivery is unavailable for this phone number. Please select bKash or Nagad payment.',
        );
      }
    }

    // Debounce rapid duplicate order submission within 15 seconds
    const recentDuplicate = await this.prisma.order.findFirst({
      where: {
        OR: [
          ...(userId ? [{ userId }] : []),
          { guestPhone: phone },
        ],
        placedAt: { gte: new Date(Date.now() - 15 * 1000) },
      },
      select: { id: true, orderNumber: true },
    });
    if (recentDuplicate) {
      throw new ConflictException(
        'An order was just submitted. Please wait a moment before submitting again.',
      );
    }

    // Manual mobile banking payment handling
    const rawSender = (dto.bkashSenderNumber ?? '').trim();
    const sender = isMobileBanking(dto.paymentMethod)
      ? (rawSender.length === 11 ? normalizeBdPhone(rawSender) : rawSender)
      : null;
    const trx = isMobileBanking(dto.paymentMethod)
      ? (dto.bkashTransactionId ?? '').trim().toUpperCase() || null
      : null;

    const order = await this.prisma.$transaction(async (tx) => {
      // If customer submitted a TrxID, verify uniqueness inside the transaction
      if (trx) {
        const used = await tx.order.findFirst({
          where: {
            bkashTransactionId: { equals: trx, mode: 'insensitive' },
            status: { not: 'CANCELLED' },
          },
          select: { id: true },
        });
        if (used) {
          throw new BadRequestException(
            'This transaction ID was already used for another order. Check it and try again.',
          );
        }
      }

      // Price everything inside the transaction with the same calculator the
      // checkout summary uses, so the order always matches what was shown.
      const quote = await this.checkoutService.quote(
        owner,
        {
          couponCode: dto.couponCode,
          lat: dto.shippingAddress.latitude,
          lng: dto.shippingAddress.longitude,
          phone,
          redeemPoints: dto.redeemPoints,
          skipLocation: dto.skipLocation,
          isAbroadOrder: dto.isAbroadOrder,
        },
        tx,
      );

      if (quote.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }
      if (quote.issues.length) {
        throw new BadRequestException(quote.issues.join('; '));
      }
      const block = quote.shipping.block;
      if (block === 'DISABLED' || !quote.shopOpen) {
        throw new BadRequestException('We are not taking delivery orders right now. Please try again later.');
      }
      if (block === 'ORIGIN_NOT_SET') {
        throw new BadRequestException('Delivery is not set up yet. Please call us to order.');
      }
      if (!dto.skipLocation && block === 'OUT_OF_AREA') {
        throw new BadRequestException(
          'Sorry, this location is outside of our delivery zone. We only deliver within the full Shahrasti area.',
        );
      }
      if (!dto.skipLocation && !quote.shipping.available) {
        throw new BadRequestException('Share your delivery location first.');
      }
      if (!quote.minOrderOk) {
        throw new BadRequestException(`The minimum order is ৳${quote.minOrderAmount}.`);
      }
      if (quote.coupon && !quote.coupon.applied) {
        throw new BadRequestException(quote.coupon.message);
      }

      const cartItems = quote._cartItems;
      const orderNumber = await nextOrderNumber(tx);

      for (const cartItem of cartItems) {
        const sellable = await tx.product.updateMany({
          where: { id: cartItem.productId, status: 'ACTIVE' },
          data: {
            // counts are whole numbers: half a kilo still counts as one sale
            soldCount: { increment: Math.ceil(toNum(cartItem.quantity)) },
            totalSales: { increment: Math.ceil(toNum(cartItem.quantity)) },
          },
        });
        if (sellable.count === 0) {
          throw new BadRequestException(
            `"${cartItem.product.name}" is no longer available`,
          );
        }
        if (cartItem.product.trackStock) {
          try {
            // Conditional decrement, per variant when the item has one, so two
            // concurrent orders can never oversell.
            await this.stock.change(tx, {
              productId: cartItem.productId,
              variantId: cartItem.variantId,
              change: -toNum(cartItem.quantity),
              reason: 'SALE',
              reference: `Order: ${orderNumber}`,
            });
          } catch (error) {
            if (error instanceof InsufficientStockError) {
              throw new BadRequestException(
                `"${cartItem.product.name}" is out of stock or no longer available`,
              );
            }
            throw error;
          }
        }
      }

      const { subtotal, shippingCost, taxAmount, discountAmount, total } =
        quote;

      const hasLocation =
        !dto.skipLocation &&
        dto.shippingAddress.latitude != null &&
        dto.shippingAddress.longitude != null;
      const locationToken = !hasLocation
        ? randomBytes(18).toString('base64url')
        : null;

      const shippingAddress = await tx.address.create({
        data: {
          fullName: dto.shippingAddress.fullName,
          phone,
          line1: dto.shippingAddress.address,
          city,
          state: dto.shippingAddress.state ?? area.division,
          division: area.division,
          district: area.district,
          upazila: area.upazila,
          postalCode: dto.shippingAddress.postalCode ?? '',
          latitude: dto.shippingAddress.latitude ?? null,
          longitude: dto.shippingAddress.longitude ?? null,
          placeName: dto.shippingAddress.placeName ?? null,
          landmark: dto.shippingAddress.landmark ?? null,
          accuracyM: dto.shippingAddress.accuracyM ?? null,
          locationSource: dto.shippingAddress.locationSource ?? (hasLocation ? 'PIN' : 'LINK'),
          locationCapturedAt: hasLocation ? new Date() : null,
          country: 'Bangladesh',
          userId,
          label: 'Shipping',
        },
      });

      // Default delivery turnaround from global settings (e.g. 60-120 mins) or route distance based
      let leadMinutes = 90;
      try {
        const deliverySettings = await this.settings.get('delivery');
        if (deliverySettings?.defaultDeliveryMinutes) {
          leadMinutes = deliverySettings.defaultDeliveryMinutes;
        }
      } catch {
        // Fallback to standard 90 mins (1.5 hours)
      }
      const roadMinutes = Math.ceil((quote.shipping.durationSec ?? 0) / 60) + 30;
      const effectiveMinutes = Math.max(leadMinutes, roadMinutes);
      const estimatedDelivery = new Date(Date.now() + effectiveMinutes * 60 * 1000);

      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          guestName: userId ? null : dto.shippingAddress.fullName,
          guestPhone: userId ? null : phone,
          guestEmail,
          subtotal,
          shippingCost,
          taxAmount,
          discountAmount,
          couponCode: quote.coupon?.applied ? quote.coupon.code : null,
          total,
          pointsEarned: quote.loyalty.pointsEarned,
          pointsRedeemed: quote.loyalty.pointsRedeemed,
          pointsDiscountAmount: quote.loyalty.pointsDiscountAmount,
          isMilestoneFreeShipping: quote.loyalty.milestone.freeShippingApplied,
          orderWeightKg: quote.orderWeightKg,
          // Nothing is confirmed at placement time for either method:
          // COD is collected on delivery, and a manually submitted bKash
          // transaction ID is only confirmed once an admin verifies it
          // against the merchant account (see AdminOrdersService.verifyPayment).
          paidAmount: 0,
          dueAmount: total,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          paymentMethod: dto.paymentMethod,
          language: dto.language === 'en' ? 'en' : 'bn',
          bkashTransactionId: trx,
          bkashSenderNumber: sender,
          estimatedDelivery,
          deliveryNote: dto.deliveryNote ?? null,
          shippingAddressId: shippingAddress.id,
          deliveryLat: dto.shippingAddress.latitude ?? null,
          deliveryLng: dto.shippingAddress.longitude ?? null,
          deliveryPlaceName: dto.shippingAddress.placeName ?? null,
          deliveryLandmark: dto.shippingAddress.landmark ?? null,
          deliveryDistanceKm: quote.shipping.distanceKm,
          deliveryDirectDistanceKm: quote.shipping.directDistanceKm ?? null,
          deliveryRoadDistanceKm: quote.shipping.roadDistanceKm ?? null,
          deliveryDurationSec: quote.shipping.durationSec,
          distanceEstimated: quote.shipping.estimated,
          deliveryFee: quote.shipping.calculatedFee,
          deliveryFeePending: !hasLocation,
          isAbroadOrder: !!dto.isAbroadOrder,
          senderCountry: dto.senderCountry?.trim() || null,
          senderContactMethod: dto.senderContactMethod || null,
          senderContactNumber: dto.senderContactNumber?.trim() || null,
          locationToken,
          deliverySlot: dto.deliverySlot ?? null,
          deliveryDate: dto.deliveryDate ? new Date(`${dto.deliveryDate}T00:00:00.000Z`) : null,
          items: {
            create: cartItems.map((item) => {
              const price = Number(
                item.variant?.price ?? item.product.sellingPrice,
              );
              return {
                productId: item.productId,
                variantId: item.variantId || null,
                quantity: item.quantity,
                price,
                total: round2(price * toNum(item.quantity)),
                // the unit text at order time: renaming a unit later never changes old orders
                unitLabel: item.product.unit?.shortLabel ?? null,
                unitLabelBn: item.product.unit?.shortLabelBn ?? null,
                orderedQty: item.product.isWeighed ? item.quantity : null,
                productName: item.product.name,
                productNameBn: item.product.nameBn,
                productSlug: item.product.slug,
                productImage: item.product.images[0]?.url ?? null,
                variantName: item.variant?.name ?? null,
                variantSku: item.variant?.sku ?? null,
              };
            }),
          },
          statusHistory: {
            create: {
              toStatus: 'PENDING',
              note: !hasLocation
                ? (dto.isAbroadOrder ? 'Order placed from abroad without location pin' : 'Order placed without location pin')
                : 'Order placed successfully',
              changedBy: 'user',
            },
          },
        },
        include: {
          items: true,
          statusHistory: true,
          shippingAddress: true,
        },
      });

      if (locationToken) {
        await tx.locationRequest.create({
          data: {
            token: locationToken,
            phone,
            name: dto.shippingAddress.fullName,
            orderId: created.id,
            expiresAt: new Date(Date.now() + 72 * 3600 * 1000), // 72 hours validity
          },
        });
      }

      if (quote._coupon?.valid) {
        await this.couponsService.redeem(
          tx,
          quote._coupon,
          userId ? { userId } : { guestPhone: phone },
          created.id,
        );
      }

      // Record loyalty points redemption
      if (userId && quote.loyalty.pointsRedeemed > 0) {
        await this.loyaltyService.recordTransaction(tx, {
          userId,
          orderId: created.id,
          points: -quote.loyalty.pointsRedeemed,
          type: 'REDEEMED_DISCOUNT',
          description: `Redeemed ${quote.loyalty.pointsRedeemed} points for ৳${quote.loyalty.pointsDiscountAmount} discount on order #${orderNumber}`,
        });
      }

      // Record loyalty points earned
      if (userId && quote.loyalty.pointsEarned > 0) {
        await this.loyaltyService.recordTransaction(tx, {
          userId,
          orderId: created.id,
          points: quote.loyalty.pointsEarned,
          type: 'EARNED_ORDER',
          description: `Earned ${quote.loyalty.pointsEarned} points from order #${orderNumber}`,
        });
      }

      // Only the lines that were ordered (an item added in another tab
      // during checkout stays in the cart).
      await tx.cartItem.deleteMany({
        where: { id: { in: cartItems.map((c) => c.id) } },
      });

      if (userId) {
        await tx.user.update({
          where: { id: userId },
          data: {
            totalOrders: { increment: 1 },
            totalSpent: { increment: total },
          },
        });
      }

      return created;
    });

    // After commit; never blocks or fails the order.
    void this.notifier.orderPlaced(order.id);
    return toCustomerOrder(order);
  }

  async cancelOrder(userId: string, orderId: string) {
    const cancelled = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id: orderId, userId },
        select: { id: true },
      });
      if (!order) throw new NotFoundException('Order not found');

      const result = await cancelOrderAndRestore(tx, orderId, {
        allowedFrom: CUSTOMER_CANCELLABLE,
        note: 'Cancelled by customer',
        changedBy: 'user',
      });
      if (!result.cancelled) {
        throw new BadRequestException(
          `Order cannot be cancelled in "${result.status}" status`,
        );
      }

      return tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: 'asc' } },
        },
      });
    });

    void this.notifier.orderStatusChanged(orderId, 'CANCELLED');
    return toCustomerOrder(cancelled);
  }

  // "Buy again": puts the items of one of my earlier orders into my cart,
  // using today's prices and stock.
  async reorder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: { orderBy: { createdAt: 'asc' } } },
    });
    if (!order) throw new NotFoundException('Order not found');

    return this.cartService.reorderItems(
      userId,
      order.items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: toNum(i.quantity),
        name: i.productName,
        nameBn: i.productNameBn ?? null,
        variantName: i.variantName,
      })),
    );
  }

  // Moves orders the customer placed as a guest into their account. The
  // proof is the same as for tracking: the order number AND the phone it was
  // placed with (an email or phone typed at sign-up is not verified, so it
  // cannot be used to take over someone else's orders).
  async claimOrders(
    user: { id: string },
    orders: { orderNumber: string; phone: string }[],
  ) {
    const results: {
      orderNumber: string;
      claimed: boolean;
      message: string;
    }[] = [];
    const seen = new Set<string>();
    for (const input of orders) {
      const orderNumber = input.orderNumber;
      if (seen.has(orderNumber)) continue;
      seen.add(orderNumber);
      const notFound = {
        orderNumber,
        claimed: false,
        message: 'No guest order found with this order number and phone number',
      };

      const order = await this.prisma.order.findUnique({
        where: { orderNumber },
        include: { shippingAddress: { select: { phone: true } } },
      });
      const phone = normalizeBdPhone(input.phone);
      const matches =
        !!order &&
        [order.guestPhone, order.shippingAddress?.phone].some(
          (p) => p && normalizeBdPhone(p) === phone,
        );
      if (!order || !matches) {
        results.push(notFound);
        continue;
      }
      if (order.userId === user.id) {
        results.push({
          orderNumber,
          claimed: true,
          message: 'Already in your account',
        });
        continue;
      }
      if (order.userId) {
        // someone else's order: same answer as "not found"
        results.push(notFound);
        continue;
      }

      const ok = await this.prisma.$transaction(async (tx) => {
        // Only one request can take a guest order.
        const taken = await tx.order.updateMany({
          where: { id: order.id, userId: null },
          data: {
            userId: user.id,
            guestName: null,
            guestPhone: null,
            guestEmail: null,
          },
        });
        if (taken.count === 0) return false;
        if (order.shippingAddressId) {
          await tx.address.update({
            where: { id: order.shippingAddressId },
            data: { userId: user.id },
          });
        }
        await tx.couponUsage.updateMany({
          where: { orderId: order.id, userId: null },
          data: { userId: user.id, guestPhone: null },
        });
        if (order.status !== 'CANCELLED' && order.status !== 'REFUNDED') {
          await tx.user.update({
            where: { id: user.id },
            data: {
              totalOrders: { increment: 1 },
              totalSpent: { increment: order.total },
            },
          });
        }
        return true;
      });
      results.push(
        ok
          ? { orderNumber, claimed: true, message: 'Added to your account' }
          : notFound,
      );
    }
    return { claimed: results.filter((r) => r.claimed).length, results };
  }

  // Public order tracking. The phone must match the order's delivery phone
  // (or the account phone) so order numbers alone cannot be enumerated.
  async trackOrder(orderNumber: string, phone: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber: orderNumber.trim().toUpperCase() },
      include: {
        items: {
          select: {
            productName: true,
            productSlug: true,
            productImage: true,
            variantName: true,
            quantity: true,
            price: true,
            total: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          select: { toStatus: true, note: true, createdAt: true },
        },
        shippingAddress: {
          select: { fullName: true, phone: true, city: true },
        },
        user: { select: { phone: true } },
      },
    });

    const phoneMatches =
      order &&
      [order.shippingAddress?.phone, order.user?.phone, order.guestPhone].some(
        (p) => p && normalizeBdPhone(p) === normalizeBdPhone(phone),
      );

    // Same error for "no such order" and "wrong phone" on purpose.
    if (!order || !phoneMatches) {
      throw new NotFoundException(
        'No order found with this order number and phone number',
      );
    }

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      courierName: order.courierName,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl,
      deliveryDistanceKm: order.deliveryDistanceKm,
      placedAt: order.placedAt,
      confirmedAt: order.confirmedAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      estimatedDelivery: order.estimatedDelivery,
      deliverySlot: order.deliverySlot,
      deliveryDate: order.deliveryDate,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      discountAmount: order.discountAmount,
      total: order.total,
      paidAmount: order.paidAmount,
      dueAmount: order.dueAmount,
      deliverTo: order.shippingAddress
        ? {
            name: maskName(order.shippingAddress.fullName),
            city: order.shippingAddress.city,
          }
        : null,
      items: order.items,
      timeline: order.statusHistory.map((h) => ({
        status: h.toStatus,
        note: h.note,
        at: h.createdAt,
      })),
    };
  }
}

function maskName(name: string) {
  return name
    .split(' ')
    .map((part) =>
      part.length <= 1 ? part : part[0] + '*'.repeat(part.length - 1),
    )
    .join(' ');
}
