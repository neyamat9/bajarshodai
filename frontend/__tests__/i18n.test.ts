import { translateApiMessage } from "@/lib/api-errors";
import { formatCount, formatMoney, formatNumber, formatQuantity, latinDigits, localizeDigits } from "@/lib/format";
import { pick, stripLocalePrefix, withLocalePrefix } from "@/lib/locale";
import bn from "@/messages/bn.json";
import en from "@/messages/en.json";

// every dotted key of a messages file, so the two languages can be compared
function keys(o: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(o).flatMap(([k, v]) => (v && typeof v === "object" ? keys(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`]));
}

describe("messages", () => {
  it("Bangla and English have exactly the same keys", () => {
    const a = keys(bn).sort();
    const b = keys(en).sort();
    expect(a.filter((k) => !b.includes(k))).toEqual([]);
    expect(b.filter((k) => !a.includes(k))).toEqual([]);
  });

  it("no message is empty", () => {
    const empty = (m: Record<string, unknown>) => keys(m).filter((k) => k.split(".").reduce<unknown>((x, p) => (x as Record<string, unknown>)[p], m) === "");
    // a few are empty on purpose (a heading lead word that Bangla does not need)
    expect(empty(en)).toEqual([]);
  });
});

describe("format", () => {
  it("writes money in Bangla digits for bn and Latin digits for en", () => {
    expect(formatMoney(6245, "bn")).toBe("৳৬,২৪৫");
    expect(formatMoney(6245, "en")).toBe("৳6,245");
  });

  it("keeps paisa only when there are some", () => {
    expect(formatMoney(120, "en")).toBe("৳120");
    expect(formatMoney(120.5, "en")).toBe("৳120.50");
  });

  it("formats quantities with decimals and no trailing zeros", () => {
    expect(formatQuantity(0.5, "en")).toBe("0.5");
    expect(formatQuantity(2, "en")).toBe("2");
    expect(formatQuantity(1.5, "bn")).toBe("১.৫");
  });

  it("formats counts and numbers", () => {
    expect(formatCount(12, "bn")).toBe("১২");
    expect(formatNumber(NaN, "en")).toBe("0");
  });

  it("turns digits both ways", () => {
    expect(localizeDigits("01712", "bn")).toBe("০১৭১২");
    expect(localizeDigits("01712", "en")).toBe("01712");
    expect(latinDigits("০১৭১২৩৪৫৬৭৮")).toBe("01712345678");
    expect(latinDigits("abc")).toBe("abc");
  });
});

describe("locale helpers", () => {
  it("adds the /en prefix only for English", () => {
    expect(withLocalePrefix("/products", "bn")).toBe("/products");
    expect(withLocalePrefix("/products", "en")).toBe("/en/products");
    expect(withLocalePrefix("/", "en")).toBe("/en");
  });

  it("strips a language prefix", () => {
    expect(stripLocalePrefix("/en/products")).toBe("/products");
    expect(stripLocalePrefix("/en")).toBe("/");
    expect(stripLocalePrefix("/products")).toBe("/products");
    expect(stripLocalePrefix("/english")).toBe("/english");
  });

  it("picks the Bangla text only when the page is Bangla and one exists", () => {
    expect(pick("bn", "Fish", "মাছ")).toBe("মাছ");
    expect(pick("bn", "Fish", "")).toBe("Fish");
    expect(pick("bn", "Fish", null)).toBe("Fish");
    expect(pick("en", "Fish", "মাছ")).toBe("Fish");
  });
});

describe("translateApiMessage", () => {
  it("leaves English pages alone", () => {
    expect(translateApiMessage("Order not found", "en")).toBe("Order not found");
  });

  it("translates known server messages for Bangla pages", () => {
    expect(translateApiMessage("Order not found", "bn")).toBe("অর্ডার পাওয়া যায়নি");
    expect(translateApiMessage("Invalid Credentials", "bn")).toBe("ফোন নম্বর বা পাসওয়ার্ড ঠিক নয়");
  });

  it("translates messages that carry a number", () => {
    expect(translateApiMessage("Only 3 of this item can be added to the cart", "bn")).toContain("৩");
  });

  it("shows an unknown message as the server wrote it", () => {
    expect(translateApiMessage("Something nobody translated", "bn")).toBe("Something nobody translated");
  });
});
