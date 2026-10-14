import { translateApiMessage } from "@/lib/api-errors";
import { toDeliveryDetails, toPickedLocation } from "@/lib/checkout-prefill";
import type { SavedAddress } from "@/lib/services/addresses.service";

describe("delivery messages in Bangla", () => {
  it("translates the fixed delivery texts", () => {
    expect(translateApiMessage("Share your delivery location first.", "bn")).toBe("আগে ডেলিভারির জায়গা শেয়ার করুন।");
    expect(translateApiMessage("This link is not valid", "bn")).toBe("এই লিংকটি ঠিক নয়");
  });

  it("translates the minimum order and out-of-area texts with their numbers", () => {
    expect(translateApiMessage("The minimum order is ৳200.", "bn")).toBe("ন্যূনতম অর্ডার ৳২০০।");
    expect(translateApiMessage("That pin is about 23.4 km away: outside the 20 km delivery area", "bn")).toContain("২৩.৪ কিমি");
  });

  it("leaves English as the server wrote it", () => {
    expect(translateApiMessage("Share your delivery location first.", "en")).toBe("Share your delivery location first.");
  });
});

describe("saved address → checkout", () => {
  const base = { id: "a", fullName: "Rahim", phone: "01712345678", line1: "House 3", landmark: "green gate", latitude: 23.1, longitude: 90.9, accuracyM: 12, locationSource: "GPS", placeName: "Kalibari" } as unknown as SavedAddress;

  it("fills the details form", () => {
    expect(toDeliveryDetails(base)).toEqual({ fullName: "Rahim", phone: "01712345678", address: "House 3", landmark: "green gate" });
  });

  it("gives the pin only when the address has one", () => {
    expect(toPickedLocation(base)).toMatchObject({ lat: 23.1, lng: 90.9, source: "GPS", placeName: "Kalibari" });
    expect(toPickedLocation({ ...base, latitude: null, longitude: null } as unknown as SavedAddress)).toBeNull();
  });
});
