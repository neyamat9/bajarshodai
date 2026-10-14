import { localizeDigits } from "./format";
import type { Locale } from "./locale";

// The server answers in English. When the page is in Bangla, the messages a customer can actually see
// are shown in Bangla here. A message that is not in the list is shown as the server wrote it.

const EXACT: Record<string, string> = {
  "Access Denied": "প্রবেশের অনুমতি নেই",
  "Address not found": "ঠিকানা পাওয়া যায়নি",
  "Alert not found": "অ্যালার্ট পাওয়া যায়নি",
  "This alert was not found (it may already be cancelled)": "অ্যালার্টটি পাওয়া যায়নি (হয়তো আগেই বাতিল হয়েছে)",
  "Already in wishlist": "পণ্যটি ইতিমধ্যে পছন্দের তালিকায় আছে",
  "Item not in wishlist": "পণ্যটি পছন্দের তালিকায় নেই",
  "Cart is empty": "আপনার কার্ট খালি",
  "Your cart is empty": "আপনার কার্ট খালি",
  "Cart item not found": "কার্টের পণ্যটি পাওয়া যায়নি",
  "Category not found": "ক্যাটাগরি পাওয়া যায়নি",
  "Choose a district (or enter a city)": "জেলা বেছে নিন (অথবা শহরের নাম লিখুন)",
  "Choose a district before the upazila": "উপজেলার আগে জেলা বেছে নিন",
  "Choose which option you are waiting for": "কোন অপশনের জন্য অপেক্ষা করছেন তা বেছে নিন",
  "Daily upload limit reached. Please try again tomorrow.": "আজকের ছবি আপলোডের সীমা শেষ। আগামীকাল আবার চেষ্টা করুন।",
  "District not found": "জেলা পাওয়া যায়নি",
  "Division not found": "বিভাগ পাওয়া যায়নি",
  "Each order item can only be listed once": "প্রতিটি পণ্য একবারই দেওয়া যাবে",
  "Email is already registered": "এই ইমেইল দিয়ে আগেই অ্যাকাউন্ট খোলা হয়েছে",
  "Enter your email address": "আপনার ইমেইল ঠিকানা লিখুন",
  "Invalid Credentials": "ফোন নম্বর বা পাসওয়ার্ড ঠিক নয়",
  "New password must be different from your current password": "নতুন পাসওয়ার্ড বর্তমান পাসওয়ার্ড থেকে আলাদা হতে হবে",
  "No order found with this order number and phone number": "এই অর্ডার নম্বর ও ফোন নম্বরে কোনো অর্ডার পাওয়া যায়নি",
  "Nothing to update": "পরিবর্তন করার কিছু নেই",
  "Notification not found": "নোটিফিকেশন পাওয়া যায়নি",
  "One of the items does not belong to this order": "একটি পণ্য এই অর্ডারের নয়",
  "Order not found": "অর্ডার পাওয়া যায়নি",
  "Product is out of stock": "পণ্যটি স্টকে নেই",
  "Product not found": "পণ্য পাওয়া যায়নি",
  "This product is not for sale at the moment": "পণ্যটি এখন বিক্রির জন্য নেই",
  "This product has no options": "এই পণ্যের কোনো অপশন নেই",
  "Variant not found": "অপশনটি পাওয়া যায়নি",
  "Variant not found for this product": "এই পণ্যের জন্য অপশনটি পাওয়া যায়নি",
  "That option does not belong to this product": "অপশনটি এই পণ্যের নয়",
  "This item is in stock right now": "পণ্যটি এখন স্টকে আছে",
  "Return request not found": "ফেরতের অনুরোধ পাওয়া যায়নি",
  "Review not found": "রিভিউ পাওয়া যায়নি",
  "You already reviewed this product": "আপনি এই পণ্যের রিভিউ আগেই দিয়েছেন",
  "Ticket not found": "টিকিট পাওয়া যায়নি",
  "This ticket is closed. Please open a new ticket.": "এই টিকিটটি বন্ধ। অনুগ্রহ করে নতুন টিকিট খুলুন।",
  "This ticket has reached its message limit. Please open a new ticket.": "এই টিকিটের বার্তার সীমা শেষ। অনুগ্রহ করে নতুন টিকিট খুলুন।",
  "Upload not found": "আপলোড করা ছবি পাওয়া যায়নি",
  "The order was updated at the same time. Please refresh and try again.": "অর্ডারটি একই সময়ে পরিবর্তন হয়েছে। পেজ রিফ্রেশ করে আবার চেষ্টা করুন।",
  "This account has been suspended. Please contact support.": "এই অ্যাকাউন্টটি বন্ধ আছে। অনুগ্রহ করে আমাদের সাথে যোগাযোগ করুন।",
  "This coupon has reached its usage limit": "এই কুপনের ব্যবহারের সীমা শেষ",
  "This phone number already has an account": "এই ফোন নম্বরে আগেই অ্যাকাউন্ট আছে",
  "This phone number already has an account. Please log in.": "এই ফোন নম্বরে আগেই অ্যাকাউন্ট আছে। অনুগ্রহ করে লগইন করুন।",
  "This reset link is invalid or has expired": "রিসেট লিংকটি ঠিক নয় অথবা মেয়াদ শেষ হয়ে গেছে",
  "This transaction ID was already used for another order. Check it and try again.":
    "এই ট্রানজেকশন আইডি আগেই অন্য অর্ডারে ব্যবহার করা হয়েছে। দেখে আবার চেষ্টা করুন।",
  "You can save at most 10 addresses": "সর্বোচ্চ ১০টি ঠিকানা সংরক্ষণ করা যায়",
  "couponCode is required": "কুপন কোড লিখুন",
  "Delivery is not set up yet. Please call us to order.": "ডেলিভারি এখনো চালু হয়নি। অর্ডার করতে আমাদের ফোন করুন।",
  "Share your delivery location first.": "আগে ডেলিভারির জায়গা শেয়ার করুন।",
  "We are not taking delivery orders right now. Please try again later.": "এখন আমরা ডেলিভারির অর্ডার নিচ্ছি না। একটু পরে আবার চেষ্টা করুন।",
  "Delivery address is required": "ডেলিভারির ঠিকানা লিখুন",
  "Location request not found": "লোকেশন লিংকটি পাওয়া যায়নি",
  "This link is not valid": "এই লিংকটি ঠিক নয়",
  "This link was already used. Thank you!": "এই লিংকটি আগেই ব্যবহার করা হয়েছে। ধন্যবাদ!",
  "orderNumber and phone are required": "অর্ডার নম্বর ও ফোন নম্বর দিন",
  "Enter a valid Bangladeshi mobile number, e.g. 01712345678": "সঠিক বাংলাদেশি মোবাইল নম্বর লিখুন, যেমন ০১৭১২৩৪৫৬৭৮",
  "Phone number or email is required": "ফোন নম্বর অথবা ইমেইল লিখুন",
  "Password is required": "পাসওয়ার্ড লিখুন",
  "Name is required": "নাম লিখুন",
  "Invalid email address": "সঠিক ইমেইল ঠিকানা লিখুন",
  "Password must be at least 6 characters long": "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে",
  "Name must be at least 2 characters long": "নাম কমপক্ষে ২ অক্ষরের হতে হবে",
  "Too Many Requests": "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।",
  "ThrottlerException: Too Many Requests": "অনেকবার চেষ্টা করা হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।",
  "Internal server error": "সার্ভারে সমস্যা হয়েছে। একটু পরে আবার চেষ্টা করুন।",
  "Unauthorized": "অনুগ্রহ করে আবার লগইন করুন",
  "Forbidden": "প্রবেশের অনুমতি নেই",
  "Not Found": "পাওয়া যায়নি",
  "Could not reach the server. Check your connection and try again.": "সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না। ইন্টারনেট দেখে আবার চেষ্টা করুন।",
};

type Rule = [RegExp, (m: RegExpMatchArray) => string];
const PATTERNS: Rule[] = [
  [/^Only (\d+) of this item can be added to the cart$/, (m) => `এই পণ্যের মাত্র ${localizeDigits(m[1], "bn")}টি কার্টে যোগ করা যাবে`],
  [/^A cart can hold at most (\d+) different items$/, (m) => `কার্টে সর্বোচ্চ ${localizeDigits(m[1], "bn")}টি আলাদা পণ্য রাখা যায়`],
  [/^"(.+)" is no longer available$/, (m) => `"${m[1]}" আর পাওয়া যাচ্ছে না`],
  [/^"(.+)" is out of stock or no longer available$/, (m) => `"${m[1]}" স্টকে নেই অথবা আর পাওয়া যাচ্ছে না`],
  [/^(.+) is not available right now$/, (m) => `${m[1]} এখন পাওয়া যাচ্ছে না`],
  [/^The minimum order is ৳(\d+(?:\.\d+)?)\.?$/, (m) => `ন্যূনতম অর্ডার ${localizeDigits(`৳${m[1]}`, "bn")}।`],
  [/^That pin is about ([\d.]+) km away: outside the ([\d.]+) km delivery area$/, (m) => `এই জায়গাটি প্রায় ${localizeDigits(m[1], "bn")} কিমি দূরে, ${localizeDigits(m[2], "bn")} কিমি ডেলিভারি এলাকার বাইরে`],
  [/^Request failed \((\d+)\)$/, () => "কিছু একটা ভুল হয়েছে। আবার চেষ্টা করুন।"],
  [/^Order cannot be cancelled in "(.+)" status$/, () => "এই অবস্থায় অর্ডার বাতিল করা যায় না"],
  [/^You can return at most (\d+) of "(.+)"$/, (m) => `"${m[2]}" সর্বোচ্চ ${localizeDigits(m[1], "bn")}টি ফেরত দেওয়া যাবে`],
  [/^(.+) must be longer than or equal to (\d+) characters$/, (m) => `কমপক্ষে ${localizeDigits(m[2], "bn")} অক্ষর লিখুন`],
  [/^(.+) should not be empty$/, () => "ঘরটি খালি রাখা যাবে না"],
  [/^(.+) must be an email$/, () => "সঠিক ইমেইল ঠিকানা লিখুন"],
];

function translateOne(part: string): string {
  const text = part.trim();
  if (EXACT[text]) return EXACT[text];
  for (const [re, fn] of PATTERNS) {
    const m = text.match(re);
    if (m) return fn(m);
  }
  return part;
}

/** Shows a server message in the page language. Several messages joined by ". " or "; " are translated one by one. */
export function translateApiMessage(message: string, locale: Locale): string {
  if (locale !== "bn" || !message) return message;
  const whole = translateOne(message);
  if (whole !== message) return whole;
  // class-validator sends several messages joined together
  const pieces = message.split(/(?<=[a-z0-9"')])\.\s+|;\s+/);
  if (pieces.length > 1) return pieces.map(translateOne).join("। ");
  return message;
}
