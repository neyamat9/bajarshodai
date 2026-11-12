import {
  MOBILE_BANKING_METHODS,
  mobileAccount,
} from '../../common/settings/settings.types';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../../common/settings';
import { LocationsService } from '../../common/locations';
import { CouponResult, CouponsService } from '../coupons/coupons.service';
import {
  round2,
  ShippingQuote,
  ShippingService,
} from '../shipping/shipping.service';
import { CheckoutSummaryDto } from './dto/checkout-summary.dto';
import { CartOwner, cartOwnerWhere } from '../../common/cart/cart-owner';
import { assertQuantity, saleRuleOf } from '../../common/cart/quantity-rules';
import { fmtQty, round3, toNum } from '../../common/utils/qty';
import { LoyaltyService } from '../loyalty/loyalty.service';

type Db = PrismaService | Prisma.TransactionClient;

const cartInclude = {
  product: {
    select: {
      id: true,
      name: true,
      nameBn: true,
      slug: true,
      status: true,
      trackStock: true,
      stock: true,
      sellingPrice: true,
      freeShipping: true,
      categoryId: true,
      sellStep: true,
      minQty: true,
      maxQty: true,
      isWeighed: true,
      weight: true,
      unit: {
        select: {
          shortLabel: true,
          shortLabelBn: true,
          allowDecimal: true,
          defaultStep: true,
          defaultMinQty: true,
        },
      },
      images: { where: { isMain: true }, take: 1, select: { url: true } },
    },
  },
  variant: {
    select: { id: true, name: true, sku: true, price: true, stock: true },
  },
} satisfies Prisma.CartItemInclude;

export type QuoteCartItem = Prisma.CartItemGetPayload<{
  include: typeof cartInclude;
}>;

export interface CheckoutQuote {
  items: {
    cartItemId: string;
    productId: string;
    variantId: string | null;
    name: string;
    slug: string;
    image: string | null;
    variantName: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    availableStock: number;
    issue: string | null;
  }[];
  itemCount: number;
  subtotal: number;
  shipping: ShippingQuote;
  coupon:
    | {
        applied: true;
        code: string;
        description: string | null;
        discountType: string;
        discount: number;
        shippingDiscount: number;
      }
    | { applied: false; code: string; message: string }
    | null;
  discountAmount: number;
  pointsDiscountAmount: number;
  pointsRedeemed: number;
  pointsEarned: number;
  orderWeightKg: number;
  loyalty: {
    enabled: boolean;
    pointsEarned: number;
    userPoints: number;
    pointsRedeemed: number;
    pointsDiscountAmount: number;
    minOrderAmountToRedeem: number;
    minPointsToRedeem: number;
    canRedeem: boolean;
    redemptionError?: string;
    milestone: {
      enabled: boolean;
      eligible: boolean;
      freeShippingApplied: boolean;
      weightExceeded: boolean;
      orderWeightKg: number;
      maxWeightKg: number;
      deliveredCount: number;
      interval: number;
    };
  };
  shippingCost: number;
  taxAmount: number;
  total: number;
  paymentMethods: string[];
  minOrderAmount: number;
  minOrderOk: boolean;
  shopOpen: boolean;
  // False when any item is unavailable / out of stock, the cart is empty, there is no delivery location yet, or the order is too small.
  canPlaceOrder: boolean;
  issues: string[];
  // Kept for order placement; stripped from API responses.
  _cartItems: QuoteCartItem[];
  _coupon: CouponResult | null;
}

@Injectable()
export class CheckoutService {
  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
    private shippingService: ShippingService,
    private couponsService: CouponsService,
    private locations: LocationsService,
    private loyaltyService: LoyaltyService,
  ) {}

  async quote(
    owner: CartOwner,
    input: CheckoutSummaryDto,
    db: Db = this.prisma,
  ): Promise<CheckoutQuote> {
    const cartItems = await db.cartItem.findMany({
      where: cartOwnerWhere(owner),
      include: cartInclude,
      orderBy: { createdAt: 'asc' },
    });

    const issues: string[] = [];
    const items = cartItems.map((ci) => {
      const unitPrice = Number(ci.variant?.price ?? ci.product.sellingPrice);
      // Items with a variant are limited by that variant's stock.
      const availableStock = toNum(
        ci.variant ? ci.variant.stock : ci.product.stock,
      );
      const quantity = toNum(ci.quantity);
      let issue: string | null = null;
      if (ci.product.status !== 'ACTIVE') {
        issue = 'This product is no longer available';
      } else if (ci.product.trackStock && availableStock < quantity) {
        issue =
          availableStock <= 0
            ? 'Out of stock'
            : `Only ${fmtQty(availableStock)} left in stock`;
      } else {
        // the unit may have changed since the item went into the cart
        try {
          assertQuantity(quantity, saleRuleOf(ci.product), ci.product.name);
        } catch (e) {
          issue = e instanceof Error ? e.message : 'Check the quantity';
        }
      }
      if (issue) issues.push(`${ci.product.name}: ${issue}`);

      return {
        cartItemId: ci.id,
        productId: ci.productId,
        variantId: ci.variantId || null,
        name: ci.product.name,
        slug: ci.product.slug,
        image: ci.product.images[0]?.url ?? null,
        variantName: ci.variant?.name ?? null,
        unitPrice,
        quantity,
        lineTotal: round2(unitPrice * quantity),
        availableStock: ci.product.trackStock ? availableStock : 9999,
        issue,
      };
    });

    if (items.length === 0) issues.push('Your cart is empty');

    const subtotal = round2(items.reduce((sum, i) => sum + i.lineTotal, 0));

    const orderWeightKg = round2(
      cartItems.reduce((sum, ci) => {
        const qty = toNum(ci.quantity);
        const unitWeight = ci.product.weight
          ? Number(ci.product.weight)
          : ci.product.isWeighed
            ? 1
            : 0.5;
        return sum + unitWeight * qty;
      }, 0),
    );

    const milestoneCheck = await this.loyaltyService.checkMilestoneEligibility(
      owner.userId ?? null,
      orderWeightKg,
    );

    const shipping = await this.shippingService.quote(subtotal, {
      lat: input.lat,
      lng: input.lng,
      skipLocation: input.skipLocation,
      allItemsFreeShipping:
        (cartItems.length > 0 &&
          cartItems.every((ci) => ci.product.freeShipping)) ||
        milestoneCheck.milestoneFreeShipping,
    });

    let couponResult: CouponResult | null = null;
    if (input.couponCode?.trim() && items.length > 0) {
      couponResult = await this.couponsService.evaluate(
        input.couponCode,
        {
          userId: owner.userId,
          guestPhone: owner.userId ? undefined : input.phone,
          subtotal,
          shippingCost: shipping.cost,
          lines: cartItems.map((ci, idx) => ({
            productId: ci.productId,
            categoryId: ci.product.categoryId,
            lineTotal: items[idx].lineTotal,
          })),
        },
        db,
      );
    }

    let userPoints = 0;
    if (owner.userId) {
      const u = await db.user.findUnique({
        where: { id: owner.userId },
        select: { loyaltyPoints: true },
      });
      userPoints = u?.loyaltyPoints ?? 0;
    }

    const loyaltySettings = await this.loyaltyService.getSettings();
    const pointsEarned = await this.loyaltyService.calculatePointsEarned(subtotal);

    let pointsRedeemed = 0;
    let pointsDiscountAmount = 0;
    let redemptionError: string | undefined;

    if (input.redeemPoints && input.redeemPoints > 0 && owner.userId) {
      const val = await this.loyaltyService.validateRedemption(
        userPoints,
        input.redeemPoints,
        subtotal,
      );
      if (val.valid) {
        pointsRedeemed = val.pointsToRedeem;
        pointsDiscountAmount = val.discountAmount;
      } else {
        redemptionError = val.error;
      }
    }

    const canRedeem =
      loyaltySettings.enabled &&
      !!owner.userId &&
      userPoints >= loyaltySettings.minPointsToRedeem &&
      subtotal >= loyaltySettings.minOrderAmountToRedeem;

    const discountAmount = couponResult?.valid
      ? couponResult.discountAmount
      : 0;
    const shippingCost = round2(
      shipping.cost - (couponResult?.valid ? couponResult.shippingDiscount : 0),
    );
    const taxAmount = 0;
    const total = round2(
      Math.max(0, subtotal - discountAmount - pointsDiscountAmount) + shippingCost + taxAmount,
    );
    const delivery = await this.settings.get('delivery');
    const minOrderOk = subtotal >= delivery.minOrderAmount;

    return {
      items,
      itemCount: items.length,
      subtotal,
      shipping,
      coupon: couponResult
        ? couponResult.valid
          ? {
              applied: true,
              code: couponResult.code,
              description: couponResult.description,
              discountType: couponResult.discountType,
              discount: couponResult.discountAmount,
              shippingDiscount: couponResult.shippingDiscount,
            }
          : {
              applied: false,
              code: couponResult.code,
              message: couponResult.message,
            }
        : null,
      discountAmount,
      pointsDiscountAmount,
      pointsRedeemed,
      pointsEarned,
      orderWeightKg,
      loyalty: {
        enabled: loyaltySettings.enabled,
        pointsEarned,
        userPoints,
        pointsRedeemed,
        pointsDiscountAmount,
        minOrderAmountToRedeem: loyaltySettings.minOrderAmountToRedeem,
        minPointsToRedeem: loyaltySettings.minPointsToRedeem,
        canRedeem,
        redemptionError,
        milestone: {
          enabled: loyaltySettings.freeShippingMilestoneEnabled,
          eligible: milestoneCheck.isEligible,
          freeShippingApplied: milestoneCheck.milestoneFreeShipping,
          weightExceeded: milestoneCheck.weightExceeded,
          orderWeightKg,
          maxWeightKg: milestoneCheck.maxWeightKg,
          deliveredCount: milestoneCheck.deliveredCount,
          interval: milestoneCheck.interval,
        },
      },
      shippingCost,
      taxAmount,
      total,
      paymentMethods: await this.enabledPaymentMethods(),
      minOrderAmount: delivery.minOrderAmount,
      minOrderOk,
      shopOpen: delivery.shopOpen,
      canPlaceOrder:
        issues.length === 0 &&
        items.length > 0 &&
        shipping.available &&
        minOrderOk &&
        delivery.shopOpen,
      issues,
      _cartItems: cartItems,
      _coupon: couponResult,
    };
  }

  async enabledPaymentMethods(): Promise<string[]> {
    const payment = await this.settings.get('payment');
    const methods: string[] = [];
    if (payment.codEnabled) methods.push('CASH_ON_DELIVERY');
    for (const m of MOBILE_BANKING_METHODS) {
      const k = m.toLowerCase() as 'bkash' | 'nagad' | 'rocket';
      if (payment[`${k}Enabled`]) methods.push(m);
    }
    return methods;
  }

  // Public shape of a quote (drops the internal fields used by placeOrder).
  toResponse(quote: CheckoutQuote) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _cartItems, _coupon, ...rest } = quote;
    return rest;
  }

  async applyCoupon(owner: CartOwner, input: CheckoutSummaryDto) {
    if (!input.couponCode?.trim()) {
      throw new BadRequestException('couponCode is required');
    }
    const quote = await this.quote(owner, input);
    if (quote.items.length === 0)
      throw new BadRequestException('Your cart is empty');
    if (quote.coupon && !quote.coupon.applied) {
      throw new BadRequestException(quote.coupon.message);
    }
    return this.toResponse(quote);
  }
}
