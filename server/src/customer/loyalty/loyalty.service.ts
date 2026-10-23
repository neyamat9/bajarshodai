import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../../common/settings';
import { Prisma, LoyaltyTxType } from '@prisma/client';

@Injectable()
export class LoyaltyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async getSettings() {
    return this.settings.get('loyalty');
  }

  /** Calculate points a customer earns based on their order subtotal */
  async calculatePointsEarned(subtotal: number): Promise<number> {
    const s = await this.getSettings();
    if (!s.enabled || s.pointsPerHundredSpent <= 0 || subtotal <= 0) return 0;
    return Math.floor((subtotal / 100) * s.pointsPerHundredSpent);
  }

  /**
   * Check if a customer is eligible for milestone free shipping based on delivered orders
   * and whether the current order's weight is within the KG cap.
   */
  async checkMilestoneEligibility(userId: string | null, orderWeightKg: number) {
    const s = await this.getSettings();
    if (!s.freeShippingMilestoneEnabled || !userId || s.freeShippingOrderInterval <= 0) {
      return {
        enabled: s.freeShippingMilestoneEnabled,
        isEligible: false,
        milestoneFreeShipping: false,
        weightExceeded: false,
        deliveredCount: 0,
        interval: s.freeShippingOrderInterval,
        maxWeightKg: s.freeShippingMaxWeightKg,
      };
    }

    const deliveredCount = await this.prisma.order.count({
      where: { userId, status: 'DELIVERED' },
    });

    // Milestone triggers on next order when deliveredCount > 0 and deliveredCount % interval === 0
    const isEligible = deliveredCount > 0 && deliveredCount % s.freeShippingOrderInterval === 0;
    const maxWeight = s.freeShippingMaxWeightKg || 5;
    const weightExceeded = isEligible && orderWeightKg > maxWeight;
    const milestoneFreeShipping = isEligible && !weightExceeded;

    return {
      enabled: s.freeShippingMilestoneEnabled,
      isEligible,
      milestoneFreeShipping,
      weightExceeded,
      deliveredCount,
      interval: s.freeShippingOrderInterval,
      maxWeightKg: maxWeight,
    };
  }

  /**
   * Validate points redemption request for an order.
   * Checks min order subtotal, min points required, max % discount, and user points balance.
   */
  async validateRedemption(userPoints: number, requestedPoints: number, subtotal: number) {
    const s = await this.getSettings();
    if (!s.enabled || requestedPoints <= 0) {
      return { valid: false, pointsToRedeem: 0, discountAmount: 0 };
    }

    if (subtotal < s.minOrderAmountToRedeem) {
      return {
        valid: false,
        pointsToRedeem: 0,
        discountAmount: 0,
        error: `Minimum order amount of ৳${s.minOrderAmountToRedeem} required to redeem points`,
      };
    }

    if (userPoints < s.minPointsToRedeem) {
      return {
        valid: false,
        pointsToRedeem: 0,
        discountAmount: 0,
        error: `Minimum ${s.minPointsToRedeem} points required to redeem`,
      };
    }

    // Points cannot exceed what the user actually has
    const usablePoints = Math.min(requestedPoints, userPoints);
    const rate = s.pointsPerCurrencyUnit || 10;
    let discountAmount = Math.floor(usablePoints / rate);

    // Max discount cap by percentage of subtotal
    const maxAllowedDiscount = (subtotal * (s.maxDiscountPercent || 30)) / 100;
    if (discountAmount > maxAllowedDiscount) {
      discountAmount = Math.floor(maxAllowedDiscount);
    }

    // Recalculate points needed for the final discountAmount
    const finalPoints = discountAmount * rate;

    return {
      valid: discountAmount > 0,
      pointsToRedeem: finalPoints,
      discountAmount,
    };
  }

  /**
   * Record a points transaction and update user's loyaltyPoints balance atomically.
   */
  async recordTransaction(
    tx: Prisma.TransactionClient,
    data: {
      userId: string;
      orderId?: string | null;
      points: number; // positive = add, negative = deduct
      type: LoyaltyTxType;
      description: string;
    },
  ) {
    const user = await tx.user.findUnique({
      where: { id: data.userId },
      select: { loyaltyPoints: true },
    });
    if (!user) throw new BadRequestException('User not found');

    const newBalance = Math.max(0, user.loyaltyPoints + data.points);

    await tx.user.update({
      where: { id: data.userId },
      data: { loyaltyPoints: newBalance },
    });

    return tx.loyaltyTransaction.create({
      data: {
        userId: data.userId,
        orderId: data.orderId ?? null,
        points: data.points,
        type: data.type,
        description: data.description,
        balanceAfter: newBalance,
      },
    });
  }

  /**
   * Refund points redeemed on an order if the order is cancelled.
   */
  async refundOrderPoints(tx: Prisma.TransactionClient, orderId: string) {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      select: { userId: true, pointsRedeemed: true, orderNumber: true },
    });

    if (order?.userId && order.pointsRedeemed > 0) {
      await this.recordTransaction(tx, {
        userId: order.userId,
        orderId,
        points: order.pointsRedeemed,
        type: 'REFUNDED_ORDER',
        description: `Refund points for cancelled order #${order.orderNumber}`,
      });
      await tx.order.update({
        where: { id: orderId },
        data: { pointsRedeemed: 0, pointsDiscountAmount: 0 },
      });
    }
  }

  /**
   * Customer account summary: points balance, BDT worth, milestone status, and history.
   */
  async getCustomerSummary(userId: string) {
    const [user, s, deliveredCount, transactions] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { loyaltyPoints: true },
      }),
      this.getSettings(),
      this.prisma.order.count({
        where: { userId, status: 'DELIVERED' },
      }),
      this.prisma.loyaltyTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          order: { select: { orderNumber: true } },
        },
      }),
    ]);

    const points = user?.loyaltyPoints ?? 0;
    const rate = s.pointsPerCurrencyUnit || 10;
    const pointsValue = Math.floor(points / rate);

    const interval = s.freeShippingOrderInterval || 5;
    const isMilestoneUnlocked = deliveredCount > 0 && deliveredCount % interval === 0;
    const progressInCurrentCycle = deliveredCount % interval;
    const ordersUntilNextMilestone = isMilestoneUnlocked ? 0 : interval - progressInCurrentCycle;

    return {
      points,
      pointsValue,
      settings: {
        enabled: s.enabled,
        pointsPerHundredSpent: s.pointsPerHundredSpent,
        pointsPerCurrencyUnit: s.pointsPerCurrencyUnit,
        minOrderAmountToRedeem: s.minOrderAmountToRedeem,
        minPointsToRedeem: s.minPointsToRedeem,
        maxDiscountPercent: s.maxDiscountPercent,
        freeShippingMilestoneEnabled: s.freeShippingMilestoneEnabled,
        freeShippingOrderInterval: s.freeShippingOrderInterval,
        freeShippingMaxWeightKg: s.freeShippingMaxWeightKg,
      },
      milestone: {
        enabled: s.freeShippingMilestoneEnabled,
        deliveredOrders: deliveredCount,
        interval,
        progressInCycle: progressInCurrentCycle,
        ordersUntilNextMilestone,
        isMilestoneUnlocked,
        maxWeightKg: s.freeShippingMaxWeightKg || 5,
      },
      transactions: transactions.map((t) => ({
        id: t.id,
        points: t.points,
        type: t.type,
        description: t.description,
        balanceAfter: t.balanceAfter,
        orderNumber: t.order?.orderNumber ?? null,
        createdAt: t.createdAt,
      })),
    };
  }
}
