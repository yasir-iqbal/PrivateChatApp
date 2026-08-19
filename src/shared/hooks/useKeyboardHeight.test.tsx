import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Keyboard, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useKeyboardHeight } from './useKeyboardHeight';

type Handler = (event: { endCoordinates: { height: number } }) => void;

// A navigation bar 24dp tall, which is what the hook has to add back on
// Android.
const BOTTOM_INSET = 24;

function wrapper({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 24, left: 0, right: 0, bottom: BOTTOM_INSET },
      }}
    >
      {children}
    </SafeAreaProvider>
  );
}

describe('useKeyboardHeight', () => {
  let handlers: Record<string, Handler>;
  let removed: string[];
  const originalPlatform = Platform.OS;

  // The hook listens to the "will" pair on iOS and the "did" pair on Android;
  // these tests care about the behaviour, not which pair the platform uses.
  const showHandler = () => handlers.keyboardWillShow ?? handlers.keyboardDidShow;
  const hideHandler = () => handlers.keyboardWillHide ?? handlers.keyboardDidHide;

  function setPlatform(os: 'ios' | 'android') {
    Object.defineProperty(Platform, 'OS', { value: os, configurable: true });
  }

  beforeEach(() => {
    handlers = {};
    removed = [];
    jest.spyOn(Keyboard, 'addListener').mockImplementation(((event: string, handler: Handler) => {
      handlers[event] = handler;
      return { remove: () => removed.push(event) };
    }) as unknown as typeof Keyboard.addListener);
  });

  afterEach(() => {
    setPlatform(originalPlatform as 'ios' | 'android');
    jest.restoreAllMocks();
  });

  it('starts at zero', () => {
    const { result } = renderHook(() => useKeyboardHeight(), { wrapper });

    expect(result.current).toBe(0);
  });

  it('returns to zero when the keyboard closes', () => {
    const { result } = renderHook(() => useKeyboardHeight(), { wrapper });

    act(() => showHandler()?.({ endCoordinates: { height: 320 } }));
    act(() => hideHandler()?.({ endCoordinates: { height: 0 } }));

    expect(result.current).toBe(0);
  });

  // Leaked listeners would keep updating state on an unmounted screen.
  it('removes its listeners on unmount', () => {
    const { unmount } = renderHook(() => useKeyboardHeight(), { wrapper });

    unmount();

    expect(removed).toHaveLength(2);
  });

  describe('on iOS', () => {
    beforeEach(() => setPlatform('ios'));

    // iOS already measures from the bottom of the screen, so adding the inset
    // here would lift content a navigation bar too far.
    it('reports the height as given', () => {
      const { result } = renderHook(() => useKeyboardHeight(), { wrapper });

      act(() => showHandler()?.({ endCoordinates: { height: 320 } }));

      expect(result.current).toBe(320);
    });
  });

  describe('on Android', () => {
    beforeEach(() => setPlatform('android'));

    // The bug this hook exists to fix: Android reports the keyboard height
    // less the navigation bar, so a composer padded by the raw number sits a
    // navigation bar's worth too low and the keyboard covers most of it.
    it('adds back the navigation bar the platform leaves out', () => {
      const { result } = renderHook(() => useKeyboardHeight(), { wrapper });

      act(() => showHandler()?.({ endCoordinates: { height: 320 } }));

      expect(result.current).toBe(320 + BOTTOM_INSET);
    });

    // Observed on an emulator with the soft keyboard turned off: the platform
    // reports exactly minus the inset, and a negative padding means nothing.
    it('is zero when the platform reports no keyboard at all', () => {
      const { result } = renderHook(() => useKeyboardHeight(), { wrapper });

      act(() => showHandler()?.({ endCoordinates: { height: -BOTTOM_INSET } }));

      expect(result.current).toBe(0);
    });

    it('stays at zero once the keyboard closes', () => {
      const { result } = renderHook(() => useKeyboardHeight(), { wrapper });

      act(() => showHandler()?.({ endCoordinates: { height: 320 } }));
      act(() => hideHandler()?.({ endCoordinates: { height: 0 } }));

      expect(result.current).toBe(0);
    });
  });
});
