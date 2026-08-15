import { act, renderHook } from '@testing-library/react-native';

import { useContactPresence } from './useContactPresence';
import { ONLINE_WINDOW_MS } from '../domain/presence';
import { observePresence } from '../domain/reportPresence';

jest.mock('../domain/reportPresence');

const mockObservePresence = observePresence as jest.MockedFunction<typeof observePresence>;

describe('useContactPresence', () => {
  let emit: ((lastActiveAt: number | null) => void) | undefined;

  beforeEach(() => {
    jest.useFakeTimers();
    mockObservePresence.mockImplementation((_uid, onChange) => {
      emit = onChange;
      return jest.fn();
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('is unknown before any heartbeat arrives', () => {
    const { result } = renderHook(() => useContactPresence('uid-bob'));

    expect(result.current).toEqual({ status: 'unknown' });
  });

  it('reports online on a fresh heartbeat', () => {
    const { result } = renderHook(() => useContactPresence('uid-bob'));

    act(() => emit?.(Date.now()));

    expect(result.current).toEqual({ status: 'online' });
  });

  // Someone going offline produces no event — their heartbeat just stops — so
  // without re-evaluating on a timer the header would say "online" forever.
  it('falls to offline as the heartbeat ages out, with no new event', () => {
    const lastActiveAt = Date.now();
    const { result } = renderHook(() => useContactPresence('uid-bob'));
    act(() => emit?.(lastActiveAt));
    expect(result.current).toEqual({ status: 'online' });

    act(() => {
      // The clock has to move as well as the timers — the hook compares the
      // heartbeat against the wall clock, not against elapsed ticks.
      jest.setSystemTime(lastActiveAt + ONLINE_WINDOW_MS + 1000);
      jest.advanceTimersByTime(ONLINE_WINDOW_MS + 1000);
    });

    expect(result.current).toEqual({ status: 'offline', lastSeenAt: lastActiveAt });
  });

  it('unsubscribes on unmount', () => {
    const unsubscribe = jest.fn();
    mockObservePresence.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useContactPresence('uid-bob'));
    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });
});
