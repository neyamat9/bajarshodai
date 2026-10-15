import { beforeAll, describe, expect, it } from "vitest";
import i18n, { setLang, tr } from "@/i18n";
import { bn } from "@/i18n/bn";
import { can, canDeliver, isAdminRole } from "@/lib/access";
import { digits, money, num, orderStatusLabel } from "@/lib/format";

const holes = (s: string) => [...s.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]).sort();

describe("Bangla dictionary", () => {
  it("has a value for every key", () => {
    expect(Object.entries(bn).filter(([, v]) => !v.trim())).toEqual([]);
  });

  it("keeps the {{values}} of the English text in the Bangla text", () => {
    const wrong = Object.entries(bn).filter(([k, v]) => holes(k).join() !== holes(v).join());
    expect(wrong).toEqual([]);
  });

  it("has no key with stray spaces around it", () => {
    expect(Object.keys(bn).filter((k) => k !== k.trim())).toEqual([]);
  });
});

describe("language switch", () => {
  beforeAll(() => setLang("bn"));

  it("translates, fills values, and shows English for a text without Bangla", () => {
    expect(tr("Orders")).toBe("অর্ডার");
    expect(tr("Edit {{name}}", { name: "রহিম" })).toBe("রহিম-কে সম্পাদনা");
    expect(tr("A sentence nobody translated yet")).toBe("A sentence nobody translated yet");
  });

  it("writes numbers, money and statuses in Bangla digits and words", () => {
    expect(digits("12 Oct 2026")).toBe("১২ Oct ২০২৬");
    expect(money(6245)).toBe("৳৬,২৪৫");
    expect(num(1500)).toBe("১,৫০০");
    expect(orderStatusLabel("OUT_FOR_DELIVERY")).toBe("ডেলিভারির জন্য বের হয়েছে");
  });

  it("goes back to English with Latin digits", async () => {
    await i18n.changeLanguage("en");
    expect(tr("Orders")).toBe("Orders");
    expect(money(6245)).toBe("৳6,245");
    expect(digits("12")).toBe("12");
    await i18n.changeLanguage("bn");
  });
});

describe("access helpers", () => {
  const staff = { id: "1", name: "A", email: "", role: "STAFF", permissions: ["orders.view"], canDeliver: true };
  it("admins can do everything, staff only what they hold", () => {
    expect(can({ ...staff, role: "ADMIN" }, "staff.manage")).toBe(true);
    expect(can(staff, "orders.view")).toBe(true);
    expect(can(staff, "orders.manage")).toBe(false);
    expect(can(staff, "orders.manage", "orders.view")).toBe(true);
    expect(can(null, "orders.view")).toBe(false);
  });
  it("knows who is an admin and who can deliver", () => {
    expect(isAdminRole({ role: "SUPER_ADMIN" })).toBe(true);
    expect(isAdminRole(staff)).toBe(false);
    expect(canDeliver(staff)).toBe(true);
    expect(canDeliver({ ...staff, canDeliver: false })).toBe(false);
  });
});
