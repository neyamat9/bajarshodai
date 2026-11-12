import {
  sanitizeMessengerUsername,
  buildMessengerUrl,
  buildMessengerOrderMessage,
} from "@/lib/services/messenger-order";

describe("Messenger Order Utility", () => {
  describe("sanitizeMessengerUsername", () => {
    it("should handle plain username", () => {
      expect(sanitizeMessengerUsername("bajarshodai2")).toBe("bajarshodai2");
    });

    it("should strip leading @ from handles", () => {
      expect(sanitizeMessengerUsername("@bajarshodai2")).toBe("bajarshodai2");
    });

    it("should extract username from m.me links", () => {
      expect(sanitizeMessengerUsername("https://m.me/bajarshodai2")).toBe("bajarshodai2");
      expect(sanitizeMessengerUsername("http://m.me/bajarshodai2/")).toBe("bajarshodai2");
    });

    it("should extract username from Facebook page URLs", () => {
      expect(sanitizeMessengerUsername("https://www.facebook.com/bajarshodai2")).toBe("bajarshodai2");
      expect(sanitizeMessengerUsername("https://facebook.com/bajarshodai2/")).toBe("bajarshodai2");
      expect(sanitizeMessengerUsername("fb.com/bajarshodai2")).toBe("bajarshodai2");
    });

    it("should extract numeric ID from profile.php URLs", () => {
      expect(sanitizeMessengerUsername("https://www.facebook.com/profile.php?id=61550000000000")).toBe(
        "61550000000000",
      );
    });

    it("should return empty string for null, undefined, or empty values", () => {
      expect(sanitizeMessengerUsername(null)).toBe("");
      expect(sanitizeMessengerUsername(undefined)).toBe("");
      expect(sanitizeMessengerUsername("")).toBe("");
      expect(sanitizeMessengerUsername("   ")).toBe("");
    });
  });

  describe("buildMessengerUrl", () => {
    it("should construct valid https://m.me/ link", () => {
      expect(buildMessengerUrl("bajarshodai2")).toBe("https://m.me/bajarshodai2");
      expect(buildMessengerUrl("@bajarshodai2")).toBe("https://m.me/bajarshodai2");
      expect(buildMessengerUrl("https://facebook.com/bajarshodai2")).toBe("https://m.me/bajarshodai2");
    });

    it("should return empty string when username is absent", () => {
      expect(buildMessengerUrl(null)).toBe("");
      expect(buildMessengerUrl("")).toBe("");
    });
  });

  describe("buildMessengerOrderMessage", () => {
    it("should build localized Bangla message with product details", () => {
      const msg = buildMessengerOrderMessage({
        productName: "নাপা ৫০০ মিগ্রা",
        productSlug: "napa-500mg",
        productPrice: 120,
        locale: "bn",
        baseUrl: "https://bajarshodai.com",
      });

      expect(msg).toContain("আসসালামু আলাইকুম");
      expect(msg).toContain("নাপা ৫০০ মিগ্রা");
      expect(msg).toContain("https://bajarshodai.com/products/napa-500mg");
    });

    it("should build localized English message with product details", () => {
      const msg = buildMessengerOrderMessage({
        productName: "Fresh Milk 1L",
        productSlug: "fresh-milk-1l",
        productPrice: 90,
        locale: "en",
        baseUrl: "https://bajarshodai.com",
      });

      expect(msg).toContain("Hello! I would like to order");
      expect(msg).toContain("Fresh Milk 1L");
      expect(msg).toContain("https://bajarshodai.com/products/fresh-milk-1l");
    });

    it("should replace custom template placeholders", () => {
      const customTemplate = "অর্ডার: {product_name} | {product_price} | {product_url}";
      const msg = buildMessengerOrderMessage({
        productName: "সয়াবিন তেল ৫ লিটার",
        productSlug: "soybean-oil-5l",
        productPrice: 850,
        template: customTemplate,
        baseUrl: "https://bajarshodai.com",
      });

      expect(msg).toContain("অর্ডার: সয়াবিন তেল ৫ লিটার");
      expect(msg).toContain("https://bajarshodai.com/products/soybean-oil-5l");
    });
  });
});
