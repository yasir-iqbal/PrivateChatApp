import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';

import { usePresenceReporter } from './usePresenceReporter';
import { HEARTBEAT_INTERVAL_MS } from '../domain/presence';
import { reportPresence } from '../domain/reportPresence';

jest.mock('../domain/reportPresence');

const mockReportPresence = reportPresence as jest.MockedFunction<typeof reportPresence>;

describe('usePresenceReporter', () => {
  let appStateHandler: ((state: string) => void) | undefined;
  let removed = false;

  beforeEach(() => {
    jest.useFakeTimers();
    removed = false;
    mockReportPresence.mockResolvedValue(undefined);
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((_event: string, handler: (state: string) => void) => {
      appStateHandler = handler;
      return { remove: () => { removed = true; } };
    }) as unknown as typeof AppState.addEventListener);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('beats immediately so the user shows as online without waiting an interval', () => {
    renderHook(() => usePresenceReporter('uid-me', 'me@b.com'));

    expect(mockReportPresence).toHaveBeenCalledWith('uid-me', 'me@b.com');
  });

  it('keeps beating on the interval', () => {
    renderHook(() => usePresenceReporter('uid-me', 'me@b.com'));

    act(() => { jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS * 2); });

    expect(mockReportPresence).toHaveBeenCalledTimes(3);
  });

  it('does nothing when signed out', () => {
    renderHook(() => usePresenceReporter(undefined, undefined));

    expect(mockReportPresence).not.toHaveBeenCalled();
  });

  // Going quiet is the only signal the other side gets that we have left, so
  // the beat has to actually stop when the app is backgrounded.
  it('stops beating when the app is backgrounded', () => {
    renderHook(() => usePresenceReporter('uid-me', 'me@b.com'));
    mockReportPresence.mockClear();

    act(() => appStateHandler?.('background'));
    act(() => { jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS * 3); });

    expect(mockReportPresence).not.toHaveBeenCalled();
  });

  it('resumes beating when the app comes back', () => {
    renderHook(() => usePresenceReporter('uid-me', 'me@b.com'));
    act(() => appStateHandler?.('background'));
    mockReportPresence.mockClear();

    act(() => appStateHandler?.('active'));

    expect(mockReportPresence).toHaveBeenCalledTimes(1);
  });

  it('stops the timer and listener on unmount', () => {
    const { unmount } = renderHook(() => usePresenceReporter('uid-me', 'me@b.com'));
    mockReportPresence.mockClear();

    unmount();
    act(() => { jest.advanceTimersByTime(HEARTBEAT_INTERVAL_MS * 3); });

    expect(mockReportPresence).not.toHaveBeenCalled();
    expect(removed).toBe(true);
  });

  it('swallows reporting failures', () => {
    mockReportPresence.mockRejectedValue(new Error('offline'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(() => renderHook(() => usePresenceReporter('uid-me', 'me@b.com'))).not.toThrow();

    warn.mockRestore();
  });
});
