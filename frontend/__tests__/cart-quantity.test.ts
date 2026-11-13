import { mapCartItem } from "../lib/services/cart.service";
import { stepUp, stepDown, round3 } from "../lib/quantity";
import { latinDigits } from "../lib/format";

describe("Cart Quantity & Max Order Quantity", () => {
  describe("mapCartItem", () => {
    it("handles untracked products (trackStock: false) without zeroing stock", () => {
      const serverItem = {
        id: "cart-item-1",
        quantity: 1,
        product: {
          id: "prod-tomato",
          slug: "red-tomato",
          name: "Red Tomato",
          nameBn: "লাল টমেটো",
          sellingPrice: 80,
          trackStock: false,
          stock: 0,
          maxQty: 5,
          unit: {
            code: "kg",
            shortLabel: "kg",
            shortLabelBn: "কেজি",
            allowDecimal: true,
            step: 0.5,
            minQty: 0.5,
            maxQty: 5,
          },
          images: [{ url: "/images/tomato.jpg" }],
        },
      };

      const mapped = mapCartItem(serverItem, "bn");
      expect(mapped.stock).toBe(9999);
      expect(mapped.trackStock).toBe(false);
      expect(mapped.maxQty).toBe(5);
      expect(mapped.unit?.maxQty).toBe(5);
      expect(mapped.unit?.step).toBe(0.5);
    });

    it("handles tracked products with strict stock and maxQty", () => {
      const serverItem = {
        id: "cart-item-2",
        quantity: 2,
        product: {
          id: "prod-oil",
          slug: "mustard-oil",
          name: "Mustard Oil 1L",
          nameBn: "সরিষার তেল ১লি",
          sellingPrice: 240,
          trackStock: true,
          stock: 10,
          maxQty: 3,
          unit: {
            code: "bottle",
            shortLabel: "bottle",
            shortLabelBn: "বোতল",
            allowDecimal: false,
            step: 1,
            minQty: 1,
            maxQty: 3,
          },
          images: [{ url: "/images/oil.jpg" }],
        },
      };

      const mapped = mapCartItem(serverItem, "en");
      expect(mapped.stock).toBe(10);
      expect(mapped.trackStock).toBe(true);
      expect(mapped.maxQty).toBe(3);
      expect(mapped.unit?.maxQty).toBe(3);
    });
  });

  describe("stepUp & stepDown with maxQty limit", () => {
    it("allows stepping up untracked product until maxQty is reached", () => {
      const unit = {
        code: "kg",
        label: "কেজি",
        allowDecimal: true,
        step: 1,
        minQty: 1,
        maxQty: 4,
      };
      // Effective cap for untracked item with maxQty 4 is 4
      const cap = 4;

      expect(stepUp(1, unit, cap)).toBe(2);
      expect(stepUp(2, unit, cap)).toBe(3);
      expect(stepUp(3, unit, cap)).toBe(4);
      // Reached maxQty 4 -> next step returns null
      expect(stepUp(4, unit, cap)).toBeNull();
    });

    it("caps at physical stock when stock is less than maxQty", () => {
      const unit = {
        code: "pc",
        label: "টি",
        allowDecimal: false,
        step: 1,
        minQty: 1,
        maxQty: 10,
      };
      const stock = 3;
      const effectiveCap = Math.min(stock, unit.maxQty);

      expect(stepUp(1, unit, effectiveCap)).toBe(2);
      expect(stepUp(2, unit, effectiveCap)).toBe(3);
      expect(stepUp(3, unit, effectiveCap)).toBeNull();
    });

    it("steps down correctly and returns null at minQty", () => {
      const unit = {
        code: "kg",
        label: "কেজি",
        allowDecimal: true,
        step: 0.5,
        minQty: 0.5,
        maxQty: 10,
      };

      expect(stepDown(1.5, unit)).toBe(1);
      expect(stepDown(1.0, unit)).toBe(0.5);
      expect(stepDown(0.5, unit)).toBeNull();
    });
  });

  describe("Direct numeric input parsing & precision", () => {
    it("converts Bengali digits to Latin digits accurately", () => {
      expect(latinDigits("১")).toBe("1");
      expect(latinDigits("১২")).toBe("12");
      expect(latinDigits("৩.৫")).toBe("3.5");
      expect(latinDigits("০")).toBe("0");
      expect(latinDigits("৯৮৭৬৫৪৩২১০")).toBe("9876543210");
    });

    it("bulletproof calculation with round3", () => {
      const linePrice = 80;
      const parsedQty = parseFloat(latinDigits("২.৫"));
      const lineTotal = round3(linePrice * parsedQty);
      expect(lineTotal).toBe(200);

      // Decimal precision (0.1 + 0.2 floating point anomaly)
      const sum = round3(0.1 * 3);
      expect(sum).toBe(0.3);
    });
  });
});

