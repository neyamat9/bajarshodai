describe('cart business logic & pricing calculations', () => {
  interface CartItemStub {
    id: string;
    price: number;
    quantity: number;
  }

  function calculateSubtotal(items: CartItemStub[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  function calculateDeliveryCharge(subtotal: number, threshold = 499, baseCharge = 30): number {
    if (subtotal <= 0) return 0;
    return subtotal >= threshold ? 0 : baseCharge;
  }

  function calculateTotal(subtotal: number, deliveryCharge: number, discount = 0): number {
    return Math.max(0, subtotal - discount + deliveryCharge);
  }

  it('calculates cart subtotal correctly for multiple items', () => {
    const items: CartItemStub[] = [
      { id: '1', price: 60, quantity: 2 }, // 120
      { id: '2', price: 150, quantity: 1 }, // 150
      { id: '3', price: 80, quantity: 0.5 }, // 40 (fractional kg)
    ];

    expect(calculateSubtotal(items)).toBe(310);
  });

  it('applies free shipping threshold when subtotal meets or exceeds threshold', () => {
    expect(calculateDeliveryCharge(0)).toBe(0);
    expect(calculateDeliveryCharge(350)).toBe(30);
    expect(calculateDeliveryCharge(499)).toBe(0);
    expect(calculateDeliveryCharge(1200)).toBe(0);
  });

  it('computes net total amount including discount and delivery charges', () => {
    const subtotal = 400;
    const delivery = calculateDeliveryCharge(subtotal); // 30
    const couponDiscount = 50;

    const total = calculateTotal(subtotal, delivery, couponDiscount);
    expect(total).toBe(380); // 400 - 50 + 30
  });

  it('prevents total from becoming negative if discount exceeds subtotal', () => {
    const total = calculateTotal(100, 0, 150);
    expect(total).toBe(0);
  });
});
