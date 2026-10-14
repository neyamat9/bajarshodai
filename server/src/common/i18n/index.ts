// Small bilingual (Bangla / English) helper for the texts the server sends on its
// own: emails, the invoice and in-app notifications. Bangla is the default.
//
//   tr('bn', 'order.confirmed.title')            -> "অর্ডার নিশ্চিত হয়েছে"
//   tr('en', 'order.placed.title', { n: 'BS-1' }) -> "Order BS-1 received"

export type Lang = 'bn' | 'en';
export const DEFAULT_LANG: Lang = 'bn';

export function normalizeLang(value?: string | null): Lang {
  const v = String(value ?? '')
    .trim()
    .toLowerCase();
  if (v.startsWith('en')) return 'en';
  return 'bn';
}

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

// "৳1,250.50" -> "৳১,২৫০.৫০": converts only the digits.
export function bnDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

export function localizeDigits(lang: Lang, input: string | number): string {
  return lang === 'bn' ? bnDigits(input) : String(input);
}

export function fmtNumber(lang: Lang, value: unknown, maxFraction = 3): string {
  const n = Number(value ?? 0);
  const s = n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFraction,
  });
  return localizeDigits(lang, s);
}

export function fmtMoney(lang: Lang, amount: unknown, symbol = '৳'): string {
  return `${symbol}${fmtNumber(lang, amount, 2)}`;
}

const BN_MONTHS = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];
const EN_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// "14 Oct 2026" / "১৪ অক্টোবর ২০২৬", in Bangladesh time.
export function fmtDate(lang: Lang, value: Date | string | number): string {
  const d = new Date(value);
  const parts = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Dhaka',
  }).formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const day = get('day');
  const month = get('month') - 1;
  const year = get('year');
  return lang === 'bn'
    ? `${bnDigits(day)} ${BN_MONTHS[month]} ${bnDigits(year)}`
    : `${String(day).padStart(2, '0')} ${EN_MONTHS[month]} ${year}`;
}

type Entry = { bn: string; en: string };

const M: Record<string, Entry> = {
  // ---- common labels (emails + invoice) ----
  'hi': { bn: 'প্রিয় {name},', en: 'Hi {name},' },
  'label.orderNumber': { bn: 'অর্ডার নম্বর', en: 'Order number' },
  'label.orderTotal': { bn: 'মোট দাম', en: 'Order total' },
  'label.payment': { bn: 'পেমেন্ট', en: 'Payment' },
  'label.item': { bn: 'পণ্য', en: 'Item' },
  'label.qty': { bn: 'পরিমাণ', en: 'Qty' },
  'label.total': { bn: 'মোট', en: 'Total' },
  'label.subtotal': { bn: 'পণ্যের দাম', en: 'Subtotal' },
  'label.discount': { bn: 'ছাড়', en: 'Discount' },
  'label.delivery': { bn: 'ডেলিভারি চার্জ', en: 'Delivery charge' },
  'label.free': { bn: 'ফ্রি', en: 'Free' },
  'label.tax': { bn: 'ট্যাক্স', en: 'Tax' },
  'label.paid': { bn: 'পরিশোধিত', en: 'Paid' },
  'label.due': { bn: 'বাকি', en: 'Amount due' },
  'label.unitPrice': { bn: 'একক দাম', en: 'Unit price' },
  'label.amount': { bn: 'টাকা', en: 'Amount' },
  'label.hotline': { bn: 'হটলাইন', en: 'Hotline' },
  'label.note': { bn: 'নোট', en: 'Note' },
  'label.tracking': { bn: 'ট্র্যাকিং নম্বর', en: 'Tracking number' },
  'label.viewOrder': { bn: 'আপনার অর্ডার দেখুন', en: 'View your order' },
  'label.viewTicket': { bn: 'টিকিট দেখুন', en: 'View ticket' },

  // ---- payment ----
  'pay.cod': { bn: 'ক্যাশ অন ডেলিভারি', en: 'Cash on Delivery' },
  'pay.bkash': { bn: 'বিকাশ', en: 'bKash' },
  'pay.nagad': { bn: 'নগদ', en: 'Nagad' },
  'pay.rocket': { bn: 'রকেট', en: 'Rocket' },
  'paystatus.pending': { bn: 'অপেক্ষমাণ', en: 'pending' },
  'paystatus.paid': { bn: 'পরিশোধিত', en: 'paid' },
  'paystatus.failed': { bn: 'ব্যর্থ', en: 'failed' },
  'paystatus.refunded': { bn: 'ফেরত', en: 'refunded' },
  'paystatus.partially_refunded': {
    bn: 'আংশিক ফেরত',
    en: 'partially refunded',
  },

  // ---- order status (title + body) ----
  'order.placed.title': { bn: 'অর্ডার {n} গ্রহণ করা হয়েছে', en: 'Order {n} received' },
  'order.placed.subject': { bn: 'অর্ডার নিশ্চিতকরণ — {n}', en: 'Order confirmation — {n}' },
  'order.placed.heading': { bn: 'আপনার অর্ডারের জন্য ধন্যবাদ!', en: 'Thank you for your order!' },
  'order.placed.body': {
    bn: 'আমরা আপনার অর্ডার পেয়েছি এবং শীঘ্রই নিশ্চিত করব।',
    en: 'We received your order and will confirm it soon.',
  },
  'order.placed.bodyMobile': {
    bn: 'আমরা আপনার অর্ডার পেয়েছি। আপনার {method} পেমেন্ট শীঘ্রই যাচাই করা হবে।',
    en: 'We received your order. Your {method} payment will be verified shortly.',
  },
  'order.verify': {
    bn: 'আমরা আপনার {method} পেমেন্ট (ট্রানজেকশন আইডি {trx}) যাচাই করে অর্ডার নিশ্চিত করব।',
    en: 'We will verify your {method} payment (TrxID {trx}) and confirm your order.',
  },
  'order.CONFIRMED.title': { bn: 'অর্ডার নিশ্চিত হয়েছে', en: 'Order confirmed' },
  'order.CONFIRMED.body': {
    bn: 'আপনার অর্ডারটি নিশ্চিত করা হয়েছে, শীঘ্রই প্যাক করা হবে।',
    en: 'Your order has been confirmed and will be packed soon.',
  },
  'order.PROCESSING.title': { bn: 'অর্ডার প্রস্তুত হচ্ছে', en: 'Order is being processed' },
  'order.PROCESSING.body': {
    bn: 'আমরা আপনার অর্ডার প্যাক করছি।',
    en: 'We are packing your order.',
  },
  'order.SHIPPED.title': { bn: 'অর্ডার পাঠানো হয়েছে', en: 'Order shipped' },
  'order.SHIPPED.body': {
    bn: 'আপনার অর্ডারটি আমাদের ডেলিভারি কর্মীর কাছে দেওয়া হয়েছে।',
    en: 'Your order has been handed to our delivery person.',
  },
  'order.IN_TRANSIT.title': { bn: 'অর্ডার পথে আছে', en: 'Order in transit' },
  'order.IN_TRANSIT.body': {
    bn: 'আপনার অর্ডার পথে আছে।',
    en: 'Your order is on the way.',
  },
  'order.OUT_FOR_DELIVERY.title': {
    bn: 'ডেলিভারির জন্য বের হয়েছে',
    en: 'Out for delivery',
  },
  'order.OUT_FOR_DELIVERY.body': {
    bn: 'আপনার অর্ডার আজ পৌঁছে দেওয়া হবে। অনুগ্রহ করে ফোন খোলা রাখুন।',
    en: 'Your order will be delivered today. Please keep your phone reachable.',
  },
  'order.DELIVERED.title': { bn: 'অর্ডার পৌঁছে গেছে', en: 'Order delivered' },
  'order.DELIVERED.body': {
    bn: 'আপনার অর্ডার পৌঁছে দেওয়া হয়েছে। আমাদের সাথে কেনাকাটার জন্য ধন্যবাদ!',
    en: 'Your order has been delivered. Thank you for shopping with us!',
  },
  'order.CANCELLED.title': { bn: 'অর্ডার বাতিল হয়েছে', en: 'Order cancelled' },
  'order.CANCELLED.body': {
    bn: 'আপনার অর্ডারটি বাতিল করা হয়েছে।',
    en: 'Your order has been cancelled.',
  },
  'order.ON_HOLD.title': { bn: 'অর্ডার স্থগিত', en: 'Order on hold' },
  'order.ON_HOLD.body': {
    bn: 'আপনার অর্ডারটি আপাতত স্থগিত আছে। আমরা শীঘ্রই যোগাযোগ করব।',
    en: 'Your order is on hold. We will contact you shortly.',
  },
  'order.RETURNED.title': { bn: 'অর্ডার ফেরত', en: 'Order returned' },
  'order.RETURNED.body': {
    bn: 'আপনার অর্ডারটি ফেরত হিসেবে চিহ্নিত করা হয়েছে।',
    en: 'Your order has been marked as returned.',
  },
  'order.REFUNDED.title': { bn: 'টাকা ফেরত দেওয়া হয়েছে', en: 'Order refunded' },
  'order.REFUNDED.body': {
    bn: 'আপনার টাকা ফেরত দেওয়ার কাজ সম্পন্ন হয়েছে।',
    en: 'Your refund has been processed.',
  },
  'order.status.label': { bn: 'অর্ডারের অবস্থা', en: 'Order status' },
  'status.PENDING': { bn: 'অপেক্ষমাণ', en: 'Pending' },
  'status.CONFIRMED': { bn: 'নিশ্চিত', en: 'Confirmed' },
  'status.PROCESSING': { bn: 'প্রস্তুত হচ্ছে', en: 'Processing' },
  'status.SHIPPED': { bn: 'পাঠানো হয়েছে', en: 'Shipped' },
  'status.IN_TRANSIT': { bn: 'পথে আছে', en: 'In transit' },
  'status.OUT_FOR_DELIVERY': { bn: 'ডেলিভারির পথে', en: 'Out for delivery' },
  'status.DELIVERED': { bn: 'পৌঁছে গেছে', en: 'Delivered' },
  'status.CANCELLED': { bn: 'বাতিল', en: 'Cancelled' },
  'status.RETURNED': { bn: 'ফেরত', en: 'Returned' },
  'status.REFUNDED': { bn: 'টাকা ফেরত', en: 'Refunded' },
  'status.ON_HOLD': { bn: 'স্থগিত', en: 'On hold' },

  // ---- payments ----
  'payment.received.title': { bn: 'পেমেন্ট পাওয়া গেছে', en: 'Payment received' },
  'payment.received.body': {
    bn: 'আমরা আপনার {amount} পেমেন্ট পেয়েছি।',
    en: 'We received your payment of {amount}.',
  },
  'payment.failed.title': {
    bn: 'পেমেন্ট যাচাই করা যায়নি',
    en: 'Payment could not be verified',
  },
  'payment.failed.body': {
    bn: 'আমরা আপনার {method} পেমেন্ট যাচাই করতে পারিনি{note}। অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন।',
    en: 'We could not verify your {method} payment{note}. Please contact us.',
  },

  // ---- returns ----
  'return.title': { bn: 'ফেরতের আপডেট — {n}', en: 'Return update — {n}' },
  'return.heading': { bn: 'ফেরতের আপডেট', en: 'Return update' },
  'return.APPROVED': {
    bn: 'আপনার ফেরতের অনুরোধ অনুমোদিত হয়েছে। আমরা পণ্য নেওয়ার ব্যবস্থা করব।',
    en: 'Your return request has been approved. We will arrange the pickup.',
  },
  'return.REJECTED': {
    bn: 'আপনার ফেরতের অনুরোধ অনুমোদিত হয়নি।',
    en: 'Your return request was not approved.',
  },
  'return.PICKED_UP': {
    bn: 'আপনার ফেরত দেওয়া পণ্য নেওয়া হয়েছে।',
    en: 'Your returned item has been picked up.',
  },
  'return.RECEIVED': {
    bn: 'আমরা আপনার ফেরত দেওয়া পণ্য পেয়েছি।',
    en: 'We have received your returned item.',
  },
  'return.REFUNDED': {
    bn: 'আপনার টাকা ফেরত দেওয়ার কাজ সম্পন্ন হয়েছে।',
    en: 'Your refund has been processed.',
  },
  'return.REPLACED': {
    bn: 'আপনার পণ্য বদলে দেওয়ার ব্যবস্থা করা হয়েছে।',
    en: 'Your replacement has been arranged.',
  },

  // ---- support tickets ----
  'ticket.reply.title': { bn: 'আপনার টিকিট {n}-এর উত্তর', en: 'Reply to your ticket {n}' },
  'ticket.reply.heading': {
    bn: 'আমরা আপনার সাপোর্ট টিকিটের উত্তর দিয়েছি',
    en: 'We replied to your support ticket',
  },
  'ticket.update.title': { bn: 'টিকিট {n} আপডেট', en: 'Ticket {n} update' },
  'ticket.update.heading': { bn: 'সাপোর্ট টিকিটের আপডেট', en: 'Support ticket update' },
  'ticket.RESOLVED': {
    bn: 'আপনার সাপোর্ট টিকিটের সমাধান হয়েছে।',
    en: 'Your support ticket has been marked as resolved.',
  },
  'ticket.CLOSED': {
    bn: 'আপনার সাপোর্ট টিকিট বন্ধ করা হয়েছে।',
    en: 'Your support ticket has been closed.',
  },
  'ticket.IN_PROGRESS': {
    bn: 'আমরা আপনার সাপোর্ট টিকিট নিয়ে কাজ করছি।',
    en: 'We are working on your support ticket.',
  },
  'ticket.OPEN': {
    bn: 'আপনার সাপোর্ট টিকিট আবার খোলা হয়েছে।',
    en: 'Your support ticket has been re-opened.',
  },

  // ---- password reset ----
  'reset.subject': { bn: '{store}: পাসওয়ার্ড রিসেট করুন', en: 'Reset your {store} password' },
  'reset.hi': { bn: 'প্রিয় {name},', en: 'Hi {name},' },
  'reset.text': {
    bn: 'আপনার {store} পাসওয়ার্ড রিসেটের অনুরোধ পেয়েছি। নতুন পাসওয়ার্ড দিতে নিচের লিংকে যান (লিংকটি {min} মিনিট পর্যন্ত চলবে):',
    en: 'We received a request to reset your {store} password. Open this link to choose a new one (valid for {min} minutes):',
  },
  'reset.button': { bn: 'পাসওয়ার্ড রিসেট করুন', en: 'Reset password' },
  'reset.ignore': {
    bn: 'আপনি অনুরোধ না করে থাকলে এই ইমেইল উপেক্ষা করুন।',
    en: "If you didn't request this, you can ignore this email.",
  },
  'reset.generic': {
    bn: 'এই ইমেইলে অ্যাকাউন্ট থাকলে পাসওয়ার্ড রিসেটের লিংক পাঠানো হয়েছে।',
    en: 'If an account exists for this email, a password reset link has been sent.',
  },

  // ---- newsletter / back in stock ----
  'news.subject': { bn: '{store} নিউজলেটারে স্বাগতম', en: 'Welcome to the {store} newsletter' },
  'news.heading': { bn: 'আপনি সাবস্ক্রাইব করেছেন!', en: "You're subscribed!" },
  'news.body': {
    bn: '{store}-এ সাবস্ক্রাইব করার জন্য ধন্যবাদ। নতুন পণ্য, অফার ও ছাড়ের খবর সবার আগে পাবেন।',
    en: "Thanks for subscribing to {store}. You'll be the first to hear about fresh arrivals, deals and offers.",
  },
  'news.unsubscribe': { bn: 'সাবস্ক্রিপশন বাতিল করুন', en: 'Unsubscribe' },
  'bis.subject': { bn: '{name} আবার স্টকে এসেছে', en: '{name} is back in stock' },
  'bis.body': {
    bn: 'সুখবর! {name} এখন আবার {store}-এ পাওয়া যাচ্ছে।',
    en: 'Good news! {name} is back in stock at {store}.',
  },
  'bis.buy': { bn: 'কিনুন', en: 'Buy it' },
  'bis.stop': { bn: 'এই অ্যালার্ট বন্ধ করুন', en: 'Stop these alerts' },

  // ---- invoice ----
  'inv.title': { bn: 'ইনভয়েস', en: 'INVOICE' },
  'inv.orderDate': { bn: 'অর্ডারের তারিখ', en: 'Order date' },
  'inv.issued': { bn: 'ইস্যু', en: 'Issued' },
  'inv.billTo': { bn: 'গ্রাহকের তথ্য', en: 'Bill / Ship to' },
  'inv.print': { bn: 'প্রিন্ট / PDF সেভ করুন', en: 'Print / Save as PDF' },
  'inv.trx': { bn: 'ট্রানজেকশন আইডি', en: 'TrxID' },
  'inv.thanks': { bn: 'আমাদের সাথে কেনাকাটার জন্য ধন্যবাদ', en: 'Thank you for shopping with us' },
  'inv.help': { bn: 'সাহায্যের জন্য কল করুন {phone}', en: 'For help, call {phone}' },
  'inv.generated': {
    bn: 'এটি কম্পিউটারে তৈরি ইনভয়েস, স্বাক্ষরের প্রয়োজন নেই।',
    en: 'This is a computer-generated invoice and does not require a signature.',
  },
};

export type MessageKey = string;

// Looks up a message and fills {placeholders}. Unknown keys return the key, so
// a missing translation is visible instead of silently blank.
export function tr(
  lang: Lang,
  key: MessageKey,
  vars: Record<string, string | number> = {},
): string {
  const entry = M[key];
  if (!entry) return key;
  const text = entry[lang] ?? entry.bn;
  return text.replace(/\{(\w+)\}/g, (_, k: string) =>
    vars[k] === undefined ? `{${k}}` : String(vars[k]),
  );
}

export function hasMessage(key: MessageKey): boolean {
  return key in M;
}

const PAYMENT_KEY: Record<string, string> = {
  CASH_ON_DELIVERY: 'pay.cod',
  BKASH: 'pay.bkash',
  NAGAD: 'pay.nagad',
  ROCKET: 'pay.rocket',
};

export function paymentLabel(lang: Lang, method: string): string {
  const key = PAYMENT_KEY[method];
  return key ? tr(lang, key) : method;
}

export function paymentStatusLabel(lang: Lang, status: string): string {
  const key = `paystatus.${status.toLowerCase()}`;
  return hasMessage(key) ? tr(lang, key) : status.toLowerCase();
}

export function statusLabel(lang: Lang, status: string): string {
  const key = `status.${status}`;
  return hasMessage(key) ? tr(lang, key) : status;
}
