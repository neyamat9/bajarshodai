import {
  sanitizeWhatsAppNumber,
  buildWhatsAppOrderUrl,
} from "@/lib/services/whatsapp-order";

describe("WhatsApp Order Utility", () => {
  describe("sanitizeWhatsAppNumber", () => {
    it("should format a standard 11-digit Bangladeshi number with country code 88", () => {
      expect(sanitizeWhatsAppNumber("01712345678")).toBe("8801712345678");
    });

    it("should strip formatting like dashes, spaces, and plus signs", () => {
      expect(sanitizeWhatsAppNumber("+880 1812-345678")).toBe("8801812345678");
      expect(sanitizeWhatsAppNumber("01911-223 344")).toBe("8801911223344");
    });

    it("should keep existing 88 prefix unchanged", () => {
      expect(sanitizeWhatsAppNumber("8801700000000")).toBe("8801700000000");
    });

    it("should return empty string for null, undefined, or empty values", () => {
      expect(sanitizeWhatsAppNumber(null)).toBe("");
      expect(sanitizeWhatsAppNumber(undefined)).toBe("");
      expect(sanitizeWhatsAppNumber("")).toBe("");
      expect(sanitizeWhatsAppNumber("---")).toBe("");
    });
  });

  describe("buildWhatsAppOrderUrl", () => {
    it("should build a valid wa.me URL using default Bangla template", () => {
      const url = buildWhatsAppOrderUrl({
        whatsappNumber: "01712345678",
        productName: "নাপা ৫০০ মিগ্রা",
        productSlug: "napa-500mg",
        productPrice: 120,
        locale: "bn",
        baseUrl: "https://bajarshodai.com",
      });

      expect(url).toContain("https://wa.me/8801712345678?text=");
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain("নাপা ৫০০ মিগ্রা");
      expect(decoded).toContain("https://bajarshodai.com/products/napa-500mg");
      expect(decoded).toContain("আসসালামু আলাইকুম");
    });

    it("should build a valid wa.me URL using default English template", () => {
      const url = buildWhatsAppOrderUrl({
        whatsappNumber: "01712345678",
        productName: "Fresh Milk 1L",
        productSlug: "fresh-milk-1l",
        productPrice: 90,
        locale: "en",
        baseUrl: "https://bajarshodai.com",
      });

      expect(url).toContain("https://wa.me/8801712345678?text=");
      const decoded = decodeURIComponent(url);
      expect(decoded).toContain("Fresh Milk 1L");
      expect(decoded).toContain("Hello! I would like to order");
      expect(decoded).toContain("https://bajarshodai.com/products/fresh-milk-1l");
    });

    it("should replace custom placeholders when admin provides a template", () => {
      const customTemplate =
        "অর্ডার রিকোয়েস্ট: {product_name} | দাম: {product_price} | বিস্তারিত: {product_url}";
      const url = buildWhatsAppOrderUrl({
        whatsappNumber: "01800000000",
        productName: "সয়াবিন তেল ৫ লিটার",
        productSlug: "soybean-oil-5l",
        productPrice: 850,
        locale: "bn",
        template: customTemplate,
        baseUrl: "https://bajarshodai.com",
      });

      const decoded = decodeURIComponent(url);
      expect(decoded).toContain("অর্ডার রিকোয়েস্ট: সয়াবিন তেল ৫ লিটার");
      expect(decoded).toContain("https://bajarshodai.com/products/soybean-oil-5l");
    });

    it("should fall back to hotline if whatsappNumber is absent", () => {
      const url = buildWhatsAppOrderUrl({
        hotline: "01999888777",
        productName: "Test Product",
        productSlug: "test",
        productPrice: 50,
      });

      expect(url).toContain("https://wa.me/8801999888777?text=");
    });

    it("should return empty string if no valid phone number is available", () => {
      const url = buildWhatsAppOrderUrl({
        productName: "Test",
        productSlug: "test",
        productPrice: 10,
      });
      expect(url).toBe("");
    });
  });
});

