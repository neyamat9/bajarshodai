import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AddCartDto } from './dto/add-cart.dto';
import { CartOwner, cartOwnerWhere } from '../../common/cart/cart-owner';
import {
  assertQuantity,
  floorToStep,
  saleRuleOf,
} from '../../common/cart/quantity-rules';
import { fmtQty, round3, toNum } from '../../common/utils/qty';

// Limits that keep a cart (especially an anonymous one) from being abused.
const MAX_CART_LINES = 50;
const MAX_QTY_PER_LINE = 50;
// Guest carts untouched for this long are deleted.
const GUEST_CART_TTL_DAYS = 30;
const CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000;

export interface ReorderLine {
  productId: string;
  variantId: string | null;
  quantity: number;
  name: string;
  variantName: string | null;
}

export interface ReorderResult {
  productId: string;
  name: string;
  status: 'added' | 'adjusted' | 'unchanged' | 'skipped';
  quantity: number;
  message?: string;
}

// A cart line as the shop shows it: quantities and stock as plain numbers, with the unit rule spelled out.
type CartRow = Prisma.CartItemGetPayload<{ include: typeof cartItemInclude }>;
export function shapeCartItem(item: CartRow) {
  const { product, variant } = item;
  const rule = saleRuleOf(product);
  return {
    ...item,
    quantity: toNum(item.quantity),
    product: {
      ...product,
      stock: toNum(product.stock),
      sellingPrice: toNum(product.sellingPrice),
      regularPrice: toNum(product.regularPrice),
      sellStep: product.sellStep === null ? null : toNum(product.sellStep),
      minQty: product.minQty === null ? null : toNum(product.minQty),
      unit: product.unit
        ? {
            shortLabel: product.unit.shortLabel,
            shortLabelBn: product.unit.shortLabelBn,
            allowDecimal: product.unit.allowDecimal,
            step: rule.step,
            minQty: rule.min,
          }
        : null,
    },
    variant: variant
      ? {
          ...variant,
          price: variant.price === null ? null : toNum(variant.price),
          stock: toNum(variant.stock),
        }
      : null,
  };
}

// What a cart line shows. Never the whole product row (it holds the cost price).
const cartItemInclude = {
  product: {
    select: {
      id: true,
      slug: true,
      name: true,
      nameBn: true,
      packSize: true,
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
      sellingPrice: true,
      regularPrice: true,
      stock: true,
      status: true,
      images: {
        where: { isMain: true },
        take: 1,
        select: { url: true },
      },
    },
  },
  variant: {
    select: {
      id: true,
      name: true,
      sku: true,
      price: true,
      stock: true,
    },
  },
} satisfies Prisma.CartItemInclude;

@Injectable()
export class CartService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CartService.name);
  private cleanupTimer?: NodeJS.Timeout;

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.cleanupTimer = setInterval(() => {
      void this.cleanupExpiredGuestCarts();
    }, CLEANUP_INTERVAL_MS);
    this.cleanupTimer.unref();
  }

  onModuleDestroy() {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }

  issueGuestToken() {
    return { guestToken: randomUUID() };
  }

  async getCart(owner: CartOwner) {
    const items = await this.prisma.cartItem.findMany({
      where: cartOwnerWhere(owner),
      include: cartItemInclude,
      orderBy: { createdAt: 'desc' },
    });

    const total = items.reduce((sum, item) => {
      const price = item.variant?.price ?? item.product.sellingPrice;
      return sum + Number(price) * toNum(item.quantity);
    }, 0);

    return {
      items: items.map(shapeCartItem),
      total: Number(total.toFixed(2)),
      ...(owner.guestToken ? { guestToken: owner.guestToken } : {}),
    };
  }

  async addItem(owner: CartOwner, dto: AddCartDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId, status: 'ACTIVE' },
    });

    if (!product) throw new NotFoundException('Product not found');

    const unit = product.unitId
      ? await this.prisma.unit.findUnique({ where: { id: product.unitId } })
      : null;
    const rule = saleRuleOf({ ...product, unit });
    const label = product.nameBn ?? product.name;
    const quantity = round3(dto.quantity);
    assertQuantity(quantity, rule, label);

    if (toNum(product.stock) < rule.min) {
      throw new BadRequestException('Product is out of stock');
    }

    let variantStock = toNum(product.stock);
    if (dto.variantId) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: dto.variantId },
      });
      if (!variant || variant.productId !== dto.productId) {
        throw new NotFoundException('Variant not found');
      }
      variantStock = toNum(variant.stock);
    }
    const maxQty = Math.min(floorToStep(variantStock, rule), MAX_QTY_PER_LINE);

    const variantId = dto.variantId || null;
    const ownerWhere = cartOwnerWhere(owner);

    return this.prisma.$transaction(async (tx) => {
      // findFirst rather than the compound unique key: variantId and userId
      // may be null.
      const existing = await tx.cartItem.findFirst({
        where: { ...ownerWhere, productId: dto.productId, variantId },
      });

      if (existing) {
        const newQty = round3(toNum(existing.quantity) + quantity);
        if (newQty > maxQty) {
          throw new BadRequestException(
            `Only ${fmtQty(maxQty)} of this item can be added to the cart`,
          );
        }
        return shapeCartItem(
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: newQty },
            include: cartItemInclude,
          }),
        );
      }

      if (quantity > maxQty) {
        throw new BadRequestException(
          `Only ${fmtQty(maxQty)} of this item can be added to the cart`,
        );
      }

      const lines = await tx.cartItem.count({ where: ownerWhere });
      if (lines >= MAX_CART_LINES) {
        throw new BadRequestException(
          `A cart can hold at most ${MAX_CART_LINES} different items`,
        );
      }

      return shapeCartItem(
        await tx.cartItem.create({
          data: {
            userId: owner.userId ?? null,
            guestToken: owner.guestToken ?? null,
            productId: dto.productId,
            variantId,
            quantity,
          },
          include: cartItemInclude,
        }),
      );
    });
  }

  async updateQuantity(owner: CartOwner, itemId: string, quantity: number) {
    const item = await this.prisma.cartItem.findFirst({
      where: { id: itemId, ...cartOwnerWhere(owner) },
      include: cartItemInclude,
    });

    if (!item) throw new NotFoundException('Cart item not found');

    const rule = saleRuleOf(item.product);
    const next = round3(quantity);
    assertQuantity(next, rule, item.product.nameBn ?? item.product.name);
    const maxStock = Math.min(
      floorToStep(toNum(item.variant?.stock ?? item.product.stock), rule),
      MAX_QTY_PER_LINE,
    );
    if (next > maxStock) {
      throw new BadRequestException(
        `Only ${fmtQty(maxStock)} of this item can be added to the cart`,
      );
    }

    return shapeCartItem(
      await this.prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity: next },
        include: cartItemInclude,
      }),
    );
  }

  async removeItem(owner: CartOwner, itemId: string) {
    const deleted = await this.prisma.cartItem.deleteMany({
      where: { id: itemId, ...cartOwnerWhere(owner) },
    });
    if (deleted.count === 0) throw new NotFoundException('Cart item not found');
    return { success: true };
  }

  async clearCart(owner: CartOwner) {
    await this.prisma.cartItem.deleteMany({ where: cartOwnerWhere(owner) });
    return { success: true };
  }

  async getCartCount(owner: CartOwner) {
    const result = await this.prisma.cartItem.aggregate({
      where: cartOwnerWhere(owner),
      _sum: { quantity: true },
    });
    return { count: toNum(result._sum.quantity) };
  }

  // Puts the items of an earlier order back into the customer's cart.
  // For each line the cart ends up with at least the ordered quantity (so
  // pressing "reorder" twice does not double it), limited by current stock.
  // Items that are gone or out of stock are skipped and reported.
  async reorderItems(userId: string, lines: ReorderLine[]) {
    const results: ReorderResult[] = [];

    await this.prisma.$transaction(async (tx) => {
      let cartLines = await tx.cartItem.count({ where: { userId } });

      for (const line of lines) {
        const label = line.variantName
          ? `${line.name} (${line.variantName})`
          : line.name;
        const fail = (message: string) =>
          results.push({
            productId: line.productId,
            name: label,
            status: 'skipped',
            quantity: 0,
            message,
          });

        const product = await tx.product.findUnique({
          where: { id: line.productId },
        });
        if (!product || product.status !== 'ACTIVE') {
          fail('This product is no longer available');
          continue;
        }

        const unit = product.unitId
          ? await tx.unit.findUnique({ where: { id: product.unitId } })
          : null;
        const rule = saleRuleOf({ ...product, unit });
        let stock = toNum(product.stock);
        if (line.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: line.variantId },
          });
          if (!variant || variant.productId !== line.productId) {
            fail('This option is no longer available');
            continue;
          }
          stock = toNum(variant.stock);
        }
        const cap = Math.min(floorToStep(stock, rule), MAX_QTY_PER_LINE);
        if (cap < rule.min) {
          fail('Out of stock');
          continue;
        }

        const existing = await tx.cartItem.findFirst({
          where: {
            userId,
            productId: line.productId,
            variantId: line.variantId,
          },
        });
        const wanted = Math.max(toNum(existing?.quantity), line.quantity);
        const quantity = Math.min(wanted, cap);
        const adjusted = quantity < line.quantity;
        const message = adjusted ? `Only ${fmtQty(cap)} available` : undefined;

        if (existing) {
          if (quantity === toNum(existing.quantity)) {
            results.push({
              productId: line.productId,
              name: label,
              status: 'unchanged',
              quantity,
              message: 'Already in your cart',
            });
            continue;
          }
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity },
          });
        } else {
          if (cartLines >= MAX_CART_LINES) {
            fail('Your cart is full');
            continue;
          }
          await tx.cartItem.create({
            data: {
              userId,
              productId: line.productId,
              variantId: line.variantId,
              quantity,
            },
          });
          cartLines++;
        }
        results.push({
          productId: line.productId,
          name: label,
          status: adjusted ? 'adjusted' : 'added',
          quantity,
          message,
        });
      }
    });

    return {
      success: true,
      added: results.filter(
        (r) => r.status === 'added' || r.status === 'adjusted',
      ).length,
      items: results,
      cart: await this.getCart({ userId }),
    };
  }

  // Moves a guest cart into the customer's cart after login/registration.
  // Lines for the same product+variant are combined; quantities are capped by
  // stock and the per-line limit. The guest cart is emptied.
  async mergeGuestCart(userId: string, guestToken: string) {
    const merged = await this.prisma.$transaction(async (tx) => {
      const guestItems = await tx.cartItem.findMany({
        where: { guestToken, userId: null },
        include: cartItemInclude,
      });
      let moved = 0;

      for (const g of guestItems) {
        const rule = saleRuleOf(g.product);
        const cap = Math.min(
          floorToStep(toNum(g.variant?.stock ?? g.product.stock), rule),
          MAX_QTY_PER_LINE,
        );
        const existing = await tx.cartItem.findFirst({
          where: { userId, productId: g.productId, variantId: g.variantId },
        });

        if (g.product.status !== 'ACTIVE' || cap <= 0) {
          await tx.cartItem.delete({ where: { id: g.id } });
          continue;
        }

        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: {
              quantity: Math.min(
                round3(toNum(existing.quantity) + toNum(g.quantity)),
                cap,
              ),
            },
          });
          await tx.cartItem.delete({ where: { id: g.id } });
        } else {
          const lines = await tx.cartItem.count({ where: { userId } });
          if (lines >= MAX_CART_LINES) {
            await tx.cartItem.delete({ where: { id: g.id } });
            continue;
          }
          await tx.cartItem.update({
            where: { id: g.id },
            data: {
              userId,
              guestToken: null,
              quantity: Math.min(toNum(g.quantity), cap),
            },
          });
        }
        moved++;
      }
      return moved;
    });

    return {
      success: true,
      mergedItems: merged,
      ...(await this.getCart({ userId })),
    };
  }

  private async cleanupExpiredGuestCarts() {
    try {
      const cutoff = new Date(Date.now() - GUEST_CART_TTL_DAYS * 86400000);
      const { count } = await this.prisma.cartItem.deleteMany({
        where: { userId: null, updatedAt: { lt: cutoff } },
      });
      if (count) this.logger.log(`Removed ${count} expired guest cart items`);
    } catch (error) {
      this.logger.warn(
        `Guest cart cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
