import { getGuestChatToken } from "@/lib/services/chat.service";

describe("Live Chat Service", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("generates and persists a guest chat token in localStorage", () => {
    const token1 = getGuestChatToken();
    expect(token1).toBeTruthy();
    expect(token1.startsWith("gst_")).toBe(true);

    // Calling again returns the exact same token
    const token2 = getGuestChatToken();
    expect(token2).toBe(token1);
    expect(localStorage.getItem("bazar_guest_chat_token")).toBe(token1);
  });
});

