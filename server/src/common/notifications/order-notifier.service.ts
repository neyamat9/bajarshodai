import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NotificationType,
  OrderStatus,
  Prisma,
  ReturnStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../settings';
import { isMobileBanking, PAYMENT_LABEL } from '../settings/settings.types';
import {
  MailService,
  escapeHtml,
  formatMoney,
  renderEmailLayout,
} from '../mail';
import { NotificationsService } from './notifications.service';
import { AdminFeedService } from '../admin-feed/admin-feed.service';
import {
  Lang,
  fmtMoney,
  localizeDigits,
  normalizeLang,
  paymentLabel,
  paymentStatusLabel,
  tr,
} from '../i18n';

const orderInclude = {
  items: true,
  shippingAddress: true,
  user: { select: { id: true, name: true, email: true, language: true } },
} satisfies Prisma.OrderInclude;

type FullOrder = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

// Which in-app notification type goes with each status. The words themselves
// (title and body) live in common/i18n, in Bangla and English.
const STATUS_TYPE: Partial<Record<OrderStatus, NotificationType>> = {
  CONFIRMED: 'ORDER_CONFIRMED',
  PROCESSING: 'ORDER_UPDATED',
  SHIPPED: 'ORDER_SHIPPED',
  IN_TRANSIT: 'ORDER_SHIPPED',
  OUT_FOR_DELIVERY: 'ORDER_SHIPPED',
  DELIVERED: 'ORDER_DELIVERED',
  CANCELLED: 'ORDER_CANCELLED',
  ON_HOLD: 'ORDER_UPDATED',
  RETURNED: 'ORDER_UPDATED',
  REFUNDED: 'ORDER_UPDATED',
};

const RETURN_STATUSES: ReturnStatus[] = [
  'APPROVED',
  'REJECTED',
  'PICKED_UP',
  'RECEIVED',
  'REFUNDED',
  'REPLACED',
];

// Sends order-related notifications: in-app (registered customers) and email
// (customers and guests, per the admin email settings and the customer's own
// preferences), plus the admin "new order" alert.
//
// Customer messages follow the language the customer ordered in (Order.language);
// admin alerts stay in English.
//
// Every public method is safe to call without awaiting: failures are logged
// and never propagate to the request that triggered them.
@Injectable()
export class OrderNotifierService {
  private readonly logger = new Logger(OrderNotifierService.name);

  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
    private mail: MailService,
    private notifications: NotificationsService,
    private config: ConfigService,
    private adminFeed: AdminFeedService,
  ) {}

  private langOf(order: FullOrder): Lang {
    return normalizeLang(order.language ?? order.user?.language);
  }

  // skipAdminEmail: the shop created the order itself (phone order).
  orderPlaced(orderId: string, opts: { skipAdminEmail?: boolean } = {}) {
    return this.safely('orderPlaced', async () => {
      const order = await this.load(orderId);
      if (!order) return;
      const lang = this.langOf(order);
      if (!opts.skipAdminEmail) {
        await this.adminFeed.notify({
          type: 'NEW_ORDER',
          title: `New order ${order.orderNumber}`,
          body: `${order.shippingAddress?.fullName ?? order.user?.name ?? order.guestName ?? 'A customer'} ordered ${order.items.length} item(s), total ${formatMoney(order.total)} (${PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}).`,
          entityType: 'order',
          entityId: order.id,
          data: { orderNumber: order.orderNumber },
        });
        if (isMobileBanking(order.paymentMethod)) {
          await this.adminFeed.notify({
            type: 'PAYMENT_PENDING',
            title: `${PAYMENT_LABEL[order.paymentMethod]} payment to verify: ${order.orderNumber}`,
            body: `Transaction ${order.bkashTransactionId ?? '—'} from ${order.bkashSenderNumber ?? '—'} for ${formatMoney(order.total)}.`,
            entityType: 'order',
            entityId: order.id,
            data: { orderNumber: order.orderNumber },
          });
        }
      }
      const email = await this.settings.get('email');
      const n = order.orderNumber;
      const title = tr(lang, 'order.placed.title', { n });
      const body = isMobileBanking(order.paymentMethod)
        ? tr(lang, 'order.placed.bodyMobile', {
            method: paymentLabel(lang, order.paymentMethod),
          })
        : tr(lang, 'order.placed.body');

      if (order.userId) {
        await this.notifications.notifyInApp(order.userId, {
          type: 'ORDER_PLACED',
          title,
          body,
          data: this.data(order),
        });
      }

      if (email.notifyCustomerOrderPlaced) {
        await this.emailCustomer(order, 'ORDER_PLACED', {
          subject: tr(lang, 'order.placed.subject', { n }),
          heading: tr(lang, 'order.placed.heading'),
          intro: body,
          includeItems: true,
        });
      }

      if (
        !opts.skipAdminEmail &&
        email.notifyAdminNewOrder &&
        email.adminNotificationEmail
      ) {
        await this.emailAdminNewOrder(order, email.adminNotificationEmail);
      }
    });
  }

  orderStatusChanged(orderId: string, status: OrderStatus, note?: string) {
    return this.safely('orderStatusChanged', async () => {
      const type = STATUS_TYPE[status];
      if (!type) return;
      const order = await this.load(orderId);
      if (!order) return;
      const lang = this.langOf(order);

      const copyTitle = tr(lang, `order.${status}.title`);
      const extra =
        status === 'SHIPPED' && order.trackingNumber
          ? ` ${tr(lang, 'label.tracking')}: ${order.trackingNumber}.`
          : '';
      const body = `${tr(lang, `order.${status}.body`)}${extra}${note ? ` ${tr(lang, 'label.note')}: ${note}` : ''}`;

      if (order.userId) {
        await this.notifications.notifyInApp(order.userId, {
          type,
          title: `${copyTitle} — ${order.orderNumber}`,
          body,
          data: { ...this.data(order), status },
        });
      }

      const email = await this.settings.get('email');
      if (email.notifyCustomerOrderStatus) {
        await this.emailCustomer(order, type, {
          subject: `${copyTitle} — ${order.orderNumber}`,
          heading: copyTitle,
          intro: body,
          includeItems: status === 'DELIVERED' || status === 'CANCELLED',
        });
      }
    });
  }

  paymentUpdated(
    orderId: string,
    paymentStatus: 'PAID' | 'FAILED',
    note?: string,
  ) {
    return this.safely('paymentUpdated', async () => {
      const order = await this.load(orderId);
      if (!order) return;
      const lang = this.langOf(order);
      const type: NotificationType =
        paymentStatus === 'PAID' ? 'PAYMENT_RECEIVED' : 'PAYMENT_FAILED';
      const title = tr(
        lang,
        paymentStatus === 'PAID' ? 'payment.received.title' : 'payment.failed.title',
      );
      const body =
        paymentStatus === 'PAID'
          ? tr(lang, 'payment.received.body', {
              amount: fmtMoney(lang, order.total),
            })
          : tr(lang, 'payment.failed.body', {
              method: paymentLabel(lang, order.paymentMethod),
              note: note ? `: ${note}` : '',
            });

      if (order.userId) {
        await this.notifications.notifyInApp(order.userId, {
          type,
          title: `${title} — ${order.orderNumber}`,
          body,
          data: { ...this.data(order), paymentStatus },
        });
      }
      const email = await this.settings.get('email');
      if (email.notifyCustomerOrderStatus) {
        await this.emailCustomer(order, type, {
          subject: `${title} — ${order.orderNumber}`,
          heading: title,
          intro: body,
          includeItems: false,
        });
      }
    });
  }

  returnStatusChanged(
    returnId: string,
    status: ReturnStatus,
    note?: string | null,
  ) {
    return this.safely('returnStatusChanged', async () => {
      if (!RETURN_STATUSES.includes(status)) return;
      const ret = await this.prisma.returnRequest.findUnique({
        where: { id: returnId },
        select: { id: true, userId: true, orderId: true },
      });
      if (!ret) return;
      const order = await this.load(ret.orderId);
      if (!order) return;
      const lang = this.langOf(order);
      const body = `${tr(lang, `return.${status}`)}${note ? ` ${tr(lang, 'label.note')}: ${note}` : ''}`;
      const title = tr(lang, 'return.title', { n: order.orderNumber });

      await this.notifications.notifyInApp(ret.userId, {
        type: 'RETURN_UPDATED',
        title,
        body,
        data: { returnId: ret.id, orderId: order.id, status },
      });
      const email = await this.settings.get('email');
      if (email.notifyCustomerOrderStatus) {
        await this.emailCustomer(order, 'RETURN_UPDATED', {
          subject: title,
          heading: tr(lang, 'return.heading'),
          intro: body,
          includeItems: false,
        });
      }
    });
  }

  // ---------------------------------------------------------------------

  private async emailCustomer(
    order: FullOrder,
    type: NotificationType,
    opts: {
      subject: string;
      heading: string;
      intro: string;
      includeItems: boolean;
    },
  ) {
    const to = order.user?.email ?? order.guestEmail;
    if (!to) return; // customers without an email just get the in-app / on-screen update
    if (
      order.userId &&
      !(await this.notifications.isEnabled(order.userId, type, 'email'))
    ) {
      return;
    }

    const lang = this.langOf(order);
    const site = await this.settings.get('site');
    const money = (n: unknown) => fmtMoney(lang, n, site.currencySymbol);
    const name =
      order.user?.name ??
      order.guestName ??
      order.shippingAddress?.fullName ??
      '';
    const link = this.orderLink(order);
    const itemsHtml = opts.includeItems ? this.itemsTable(order, lang, site.currencySymbol) : '';
    const payment = this.paymentInstructions(order, lang);
    const method = paymentLabel(lang, order.paymentMethod);

    const bodyHtml = `
<h2 style="margin:0 0 12px;font-size:20px">${escapeHtml(opts.heading)}</h2>
<p style="margin:0 0 12px">${escapeHtml(tr(lang, 'hi', { name }))}</p>
<p style="margin:0 0 16px">${escapeHtml(opts.intro)}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;font-size:14px">
<tr><td style="padding:2px 12px 2px 0;color:#666">${escapeHtml(tr(lang, 'label.orderNumber'))}</td><td><strong>${escapeHtml(order.orderNumber)}</strong></td></tr>
<tr><td style="padding:2px 12px 2px 0;color:#666">${escapeHtml(tr(lang, 'label.orderTotal'))}</td><td><strong>${money(order.total)}</strong></td></tr>
<tr><td style="padding:2px 12px 2px 0;color:#666">${escapeHtml(tr(lang, 'label.payment'))}</td><td>${escapeHtml(method)} (${escapeHtml(paymentStatusLabel(lang, order.paymentStatus))})</td></tr>
</table>
${payment.html}
${itemsHtml}
<p style="margin:20px 0 0"><a href="${escapeHtml(link)}" style="display:inline-block;padding:10px 18px;background:#0b6234;color:#fff;text-decoration:none;border-radius:6px">${escapeHtml(tr(lang, 'label.viewOrder'))}</a></p>`;

    const text = [
      tr(lang, 'hi', { name }),
      '',
      opts.intro,
      '',
      `${tr(lang, 'label.orderNumber')}: ${order.orderNumber}`,
      `${tr(lang, 'label.orderTotal')}: ${money(order.total)}`,
      payment.text,
      opts.includeItems
        ? order.items
            .map(
              (i) =>
                `- ${i.productName}${i.variantName ? ` (${i.variantName})` : ''} x${localizeDigits(lang, String(i.quantity))}: ${money(i.total)}`,
            )
            .join('\n')
        : '',
      '',
      `${tr(lang, 'label.viewOrder')}: ${link}`,
    ]
      .filter((l) => l !== undefined)
      .join('\n');

    await this.mail.send({
      to,
      subject: opts.subject,
      html: renderEmailLayout(site, { title: opts.subject, bodyHtml, lang }),
      text,
    });
  }

  private async emailAdminNewOrder(order: FullOrder, to: string) {
    const site = await this.settings.get('site');
    const customer = order.user
      ? `${order.user.name} <${order.user.email ?? order.shippingAddress?.phone ?? ''}>`
      : `${order.guestName ?? order.shippingAddress?.fullName ?? 'Guest'} (guest)`;
    const phone = order.shippingAddress?.phone ?? order.guestPhone ?? '';
    const subject = `New order ${order.orderNumber} — ${formatMoney(order.total, site.currencySymbol)}`;
    const bodyHtml = `
<h2 style="margin:0 0 12px;font-size:20px">New order received</h2>
<p style="margin:0 0 4px"><strong>${escapeHtml(order.orderNumber)}</strong> — ${formatMoney(order.total, site.currencySymbol)}</p>
<p style="margin:0 0 4px">Customer: ${escapeHtml(customer)}</p>
<p style="margin:0 0 4px">Phone: ${escapeHtml(phone)}</p>
<p style="margin:0 0 4px">Payment: ${isMobileBanking(order.paymentMethod) ? `${PAYMENT_LABEL[order.paymentMethod]} (TrxID ${escapeHtml(order.bkashTransactionId ?? '-')}, from ${escapeHtml(order.bkashSenderNumber ?? '-')})` : 'Cash on Delivery'}</p>
<p style="margin:0 0 12px">Delivery: ${escapeHtml(order.shippingAddress?.city ?? '')} (${escapeHtml(order.deliveryDistanceKm ? `${String(order.deliveryDistanceKm)} km` : '')})</p>
${this.itemsTable(order, 'en', site.currencySymbol)}`;
    await this.mail.send({
      to,
      subject,
      html: renderEmailLayout(site, { title: subject, bodyHtml }),
      text:
        `New order ${order.orderNumber}\nTotal: ${formatMoney(order.total, site.currencySymbol)}\nCustomer: ${customer}\nPhone: ${phone}\n` +
        order.items.map((i) => `- ${i.productName} x${i.quantity}`).join('\n'),
    });
  }

  private itemsTable(order: FullOrder, lang: Lang, symbol: string) {
    const money = (n: unknown) => fmtMoney(lang, n, symbol);
    const rows = order.items
      .map(
        (i) => `<tr>
<td style="padding:8px 0;border-bottom:1px solid #eee">${escapeHtml(i.productName)}${i.variantName ? `<div style="color:#666;font-size:12px">${escapeHtml(i.variantName)}</div>` : ''}</td>
<td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${localizeDigits(lang, String(i.quantity))}</td>
<td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${money(i.total)}</td></tr>`,
      )
      .join('');
    const line = (label: string, value: string, bold = false) =>
      `<tr><td colspan="2" style="padding:4px 0;text-align:right;color:#666">${label}</td><td style="padding:4px 0;text-align:right">${bold ? `<strong>${value}</strong>` : value}</td></tr>`;
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin:8px 0">
<tr><th style="text-align:left;padding:6px 0;border-bottom:2px solid #111">${escapeHtml(tr(lang, 'label.item'))}</th><th style="padding:6px 8px;border-bottom:2px solid #111">${escapeHtml(tr(lang, 'label.qty'))}</th><th style="text-align:right;padding:6px 0;border-bottom:2px solid #111">${escapeHtml(tr(lang, 'label.total'))}</th></tr>
${rows}
${line(escapeHtml(tr(lang, 'label.subtotal')), money(order.subtotal))}
${Number(order.discountAmount) > 0 ? line(`${escapeHtml(tr(lang, 'label.discount'))}${order.couponCode ? ` (${escapeHtml(order.couponCode)})` : ''}`, `-${money(order.discountAmount)}`) : ''}
${line(escapeHtml(tr(lang, 'label.delivery')), Number(order.shippingCost) > 0 ? money(order.shippingCost) : escapeHtml(tr(lang, 'label.free')))}
${line(escapeHtml(tr(lang, 'label.total')), money(order.total), true)}
</table>`;
  }

  private paymentInstructions(order: FullOrder, lang: Lang) {
    if (
      !isMobileBanking(order.paymentMethod) ||
      order.paymentStatus !== 'PENDING'
    ) {
      return { html: '', text: '' };
    }
    const msg = tr(lang, 'order.verify', {
      method: paymentLabel(lang, order.paymentMethod),
      trx: order.bkashTransactionId ?? '-',
    });
    return {
      html: `<p style="margin:0 0 16px;padding:10px 12px;background:#eef7f1;border-radius:6px">${escapeHtml(msg)}</p>`,
      text: msg,
    };
  }

  private orderLink(order: FullOrder) {
    const base = (this.config.get<string>('frontend.url') ?? '').replace(
      /\/$/,
      '',
    );
    // English pages live under /en; Bangla is the default with no prefix.
    const prefix = this.langOf(order) === 'en' ? '/en' : '';
    if (order.userId) return `${base}${prefix}/orders/${order.id}`;
    const phone = order.shippingAddress?.phone ?? order.guestPhone ?? '';
    return `${base}${prefix}/track-order?orderNumber=${encodeURIComponent(order.orderNumber)}&phone=${encodeURIComponent(phone)}`;
  }

  private data(order: FullOrder) {
    return { orderId: order.id, orderNumber: order.orderNumber };
  }

  private load(orderId: string) {
    return this.prisma.order.findUnique({
      where: { id: orderId },
      include: orderInclude,
    });
  }

  private async safely(label: string, fn: () => Promise<void>) {
    try {
      await fn();
    } catch (error) {
      this.logger.error(
        `${label} notification failed: ${error instanceof Error ? error.stack : String(error)}`,
      );
    }
  }
}
