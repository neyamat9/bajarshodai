import React from "react";
import { render, act } from "@testing-library/react";
import {
  ProductQuickViewProvider,
  useProductQuickView,
} from "@/components/product/ProductQuickViewModal";
import type { Product } from "@/lib/types";

const mockPush = jest.fn();
jest.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/medicines",
  Link: ({ children }: { children?: React.ReactNode }) =>
    React.createElement("div", null, children),
}));

jest.mock("next-intl", () => ({
  useLocale: () => "bn",
  useTranslations: () => (key: string) => key,
}));

jest.mock("@/lib/hooks/use-cart", () => ({
  useCartActions: () => ({ addToCart: jest.fn() }),
}));

jest.mock("@/lib/hooks/use-wishlist", () => ({
  useWishlist: () => ({
    addToVault: jest.fn(),
    removeFromVault: jest.fn(),
    isInVault: () => false,
  }),
}));

// Mock sound & toast
jest.mock("@/lib/sound", () => ({ playClick: jest.fn() }));
jest.mock("sonner", () => ({ toast: { success: jest.fn(), info: jest.fn(), error: jest.fn() } }));

const dummyProduct = {
  id: "prod-1",
  slug: "napa-500",
  name: "Napa 500mg",
  price: 12,
  originalPrice: 15,
  stock: 100,
  images: [],
  variants: [],
  category: "medicines",
} as unknown as Product;

function TestConsumer({
  onReady,
}: {
  onReady: (ctx: ReturnType<typeof useProductQuickView>) => void;
}) {
  const ctx = useProductQuickView();
  React.useEffect(() => {
    onReady(ctx);
  }, [ctx, onReady]);
  return <div data-testid="status">{ctx.quickViewProduct ? "open" : "closed"}</div>;
}

describe("ProductQuickView History & Back Button Interception (Web)", () => {
  let pushStateSpy: jest.SpyInstance;
  let replaceStateSpy: jest.SpyInstance;
  let backSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    window.scrollTo = jest.fn();
    pushStateSpy = jest.spyOn(window.history, "pushState").mockImplementation(() => {});
    replaceStateSpy = jest.spyOn(window.history, "replaceState").mockImplementation(() => {});
    backSpy = jest.spyOn(window.history, "back").mockImplementation(() => {});
  });

  afterEach(() => {
    pushStateSpy.mockRestore();
    replaceStateSpy.mockRestore();
    backSpy.mockRestore();
  });

  it("pushes a history state when opening quick view modal", () => {
    let ctxRef: ReturnType<typeof useProductQuickView> | null = null;
    render(
      <ProductQuickViewProvider>
        <TestConsumer onReady={(ctx) => (ctxRef = ctx)} />
      </ProductQuickViewProvider>
    );

    act(() => {
      ctxRef!.openQuickView(dummyProduct);
    });

    expect(pushStateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ modal: "quickview", slug: "napa-500" }),
      "",
      expect.any(String)
    );
    expect(ctxRef!.quickViewProduct?.id).toBe("prod-1");
  });

  it("closes modal on browser popstate without calling history.back() again", () => {
    let ctxRef: ReturnType<typeof useProductQuickView> | null = null;
    render(
      <ProductQuickViewProvider>
        <TestConsumer onReady={(ctx) => (ctxRef = ctx)} />
      </ProductQuickViewProvider>
    );

    act(() => {
      ctxRef!.openQuickView(dummyProduct);
    });
    expect(ctxRef!.quickViewProduct).not.toBeNull();

    // User taps browser/phone back button -> triggers popstate
    act(() => {
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    // Modal is now closed
    expect(ctxRef!.quickViewProduct).toBeNull();
    // backSpy should NOT be called because the user's browser back action already popped the entry
    expect(backSpy).not.toHaveBeenCalled();
  });

  it("calls history.back() when modal is closed manually via closeQuickView", () => {
    let ctxRef: ReturnType<typeof useProductQuickView> | null = null;
    render(
      <ProductQuickViewProvider>
        <TestConsumer onReady={(ctx) => (ctxRef = ctx)} />
      </ProductQuickViewProvider>
    );

    act(() => {
      ctxRef!.openQuickView(dummyProduct);
    });
    expect(ctxRef!.quickViewProduct).not.toBeNull();

    // User clicks X button / backdrop -> calls closeQuickView()
    act(() => {
      ctxRef!.closeQuickView();
    });

    expect(ctxRef!.quickViewProduct).toBeNull();
    // Programmatically pops the dummy entry so history is clean
    expect(backSpy).toHaveBeenCalledTimes(1);
  });
});
