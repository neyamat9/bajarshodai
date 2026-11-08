import { BackHandler } from 'react-native';
import { useQuickViewStore } from '../src/store/useQuickViewStore';

describe('ProductQuickView BackHandler & Navigation Interception (Mobile App)', () => {
  beforeEach(() => {
    useQuickViewStore.getState().closeQuickView();
    jest.clearAllMocks();
  });

  it('correctly toggles modal open and closed state in store', () => {
    expect(useQuickViewStore.getState().isOpen).toBe(false);

    useQuickViewStore.getState().openQuickView({
      id: 'p-1',
      slug: 'test-product',
      name: 'Test Product',
      price: 100,
      unit: 'kg',
    });

    expect(useQuickViewStore.getState().isOpen).toBe(true);
    expect(useQuickViewStore.getState().product?.slug).toBe('test-product');

    useQuickViewStore.getState().closeQuickView();
    expect(useQuickViewStore.getState().isOpen).toBe(false);
    expect(useQuickViewStore.getState().product).toBeNull();
  });

  it('hardware back button press intercepts event and closes quick view modal first', () => {
    let capturedHandler: (() => boolean) | null = null;
    const addEventListenerSpy = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((event: string, handler: any) => {
        if (event === 'hardwareBackPress') {
          capturedHandler = handler;
        }
        return { remove: jest.fn() } as any;
      });

    // Simulate modal open
    useQuickViewStore.getState().openQuickView({
      id: 'p-1',
      slug: 'test-item',
      name: 'Test Item',
      price: 50,
      unit: 'piece',
    });

    // Simulate the component registering BackHandler when open
    const onHardwareBackPress = () => {
      useQuickViewStore.getState().closeQuickView();
      return true; // Prevents default exit/back screen navigation
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onHardwareBackPress);

    expect(addEventListenerSpy).toHaveBeenCalledWith('hardwareBackPress', expect.any(Function));
    expect(capturedHandler).toBeDefined();

    // Trigger hardware back press
    const handled = capturedHandler!();

    // Must return true so Android does NOT pop the underlying screen
    expect(handled).toBe(true);
    // Modal is now closed
    expect(useQuickViewStore.getState().isOpen).toBe(false);

    sub.remove();
    addEventListenerSpy.mockRestore();
  });
});
