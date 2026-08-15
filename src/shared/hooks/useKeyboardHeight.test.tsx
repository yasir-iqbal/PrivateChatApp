import { act, renderHook } from '@testing-library/react-native';
import { Keyboard } from 'react-native';

import { useKeyboardHeight } from './useKeyboardHeight';

type Handler = (event: { endCoordinates: { height: number } }) => void;

describe('useKeyboardHeight', () => {
  let handlers: Record<string, Handler>;
  let removed: string[];

  // The hook listens to the "will" pair on iOS and the "did" pair on Android;
  // these tests care about the behaviour, not which pair the platform uses.
  const showHandler = () => handlers.keyboardWillShow ?? handlers.keyboardDidShow;
  const hideHandler = () => handlers.keyboardWillHide ?? handlers.keyboardDidHide;

  beforeEach(() => {
    handlers = {};
    removed = [];
    jest.spyOn(Keyboard, 'addListener').mockImplementation(((event: string, handler: Handler) => {
      handlers[event] = handler;
      return { remove: () => removed.push(event) };
    }) as unknown as typeof Keyboard.addListener);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('starts at zero', () => {
    const { result } = renderHook(() => useKeyboardHeight());

    expect(result.current).toBe(0);
  });

  it('reports the keyboard height when it opens', () => {
    const { result } = renderHook(() => useKeyboardHeight());

    act(() => showHandler()?.({ endCoordinates: { height: 320 } }));

    expect(result.current).toBe(320);
  });

  it('returns to zero when the keyboard closes', () => {
    const { result } = renderHook(() => useKeyboardHeight());

    act(() => showHandler()?.({ endCoordinates: { height: 320 } }));
    act(() => hideHandler()?.({ endCoordinates: { height: 0 } }));

    expect(result.current).toBe(0);
  });

  // Leaked listeners would keep updating state on an unmounted screen.
  it('removes its listeners on unmount', () => {
    const { unmount } = renderHook(() => useKeyboardHeight());

    unmount();

    expect(removed).toHaveLength(2);
  });
});
