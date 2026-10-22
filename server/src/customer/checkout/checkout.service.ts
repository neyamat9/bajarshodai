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

type Db = PrismaService | Prisma.TransactionClient;

const cartInclude = {
  product: {
    select: {
      id: true,
      name: true,
      nameBn: true,
      slug: true,
      status: true,
      stock: true,
      sellingPrice: true,
      freeShipping: true,
      categoryId: true,
      sellStep: true,
      minQty: true,
      isWeighed: true,
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
      } else if (availableStock < quantity) {
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
        availableStock,
        issue,
      };
    });

    if (items.length === 0) issues.push('Your cart is empty');

    const subtotal = round2(items.reduce((sum, i) => sum + i.lineTotal, 0));
    const shipping = await this.shippingService.quote(subtotal, {
      lat: input.lat,
      lng: input.lng,
      allItemsFreeShipping:
        cartItems.length > 0 &&
        cartItems.every((ci) => ci.product.freeShipping),
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

    const discountAmount = couponResult?.valid
      ? couponResult.discountAmount
      : 0;
    const shippingCost = round2(
      shipping.cost - (couponResult?.valid ? couponResult.shippingDiscount : 0),
    );
    const taxAmount = 0;
    const total = round2(
      Math.max(0, subtotal - discountAmount) + shippingCost + taxAmount,
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
      shippingCost,
      taxAmount,
      total,
      paymentMethods: await this.enabledPaymentMethods(),
      minOrderAmount: delivery.minOrderAmount,
      minOrderOk,
      shopOpen: delivery.shopOpen,
      // false while the cart has a problem, no usable delivery location is known, or the order is too small
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
