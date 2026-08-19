import { useContext, useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

// How much of the bottom of the *screen* the on-screen keyboard covers, 0 when
// it is hidden. A screen that draws to the bottom edge can pad by this to keep
// its own content clear of the keyboard.
//
// Needed because Expo draws Android edge-to-edge, and under edge-to-edge the
// window is no longer resized when the IME opens — so the manifest's
// adjustResize does nothing and the keyboard simply covers whatever is at the
// bottom of the screen.
//
// The correction below is the part that is easy to miss. Android's
// keyboardDidShow does not report the height of the keyboard; it reports how
// much *more* of the window the keyboard hides than was already hidden by the
// navigation bar — that is, imeHeight - navigationBarHeight. Measured on a
// device with a 24dp gesture bar and no keyboard on screen at all, it reports
// exactly -24. Padding by that raw number leaves the composer short by the
// height of the navigation bar, which is what put it half behind the keyboard.
//
// Adding the bottom safe-area inset back converts it to the real distance from
// the bottom of the screen, which is the number an edge-to-edge layout needs.
// iOS already reports that distance directly, so it is left alone.
export function useKeyboardHeight(): number {
  // null rather than 0 so a hidden keyboard is distinguishable from one that
  // covers nothing — the inset must only be added back while it is showing.
  const [reportedHeight, setReportedHeight] = useState<number | null>(null);
  // Read through the context rather than useSafeAreaInsets, which throws when
  // no provider is above it. Zero is the same answer the rest of the app's
  // safe-area code falls back to, and losing the correction is a keyboard that
  // sits a little low — not worth taking a screen down over.
  const bottom = useContext(SafeAreaInsetsContext)?.bottom ?? 0;

  useEffect(() => {
    // iOS fires the "will" events early enough to animate with the keyboard;
    // Android only has the "did" pair.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, (event) => {
      setReportedHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener(hideEvent, () => setReportedHeight(null));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (reportedHeight === null) return 0;
  if (Platform.OS !== 'android') return reportedHeight;

  // Clamped because the sum is negative on the emulator, where the soft
  // keyboard can be off entirely, and a negative padding is not meaningful.
  return Math.max(0, reportedHeight + bottom);
}
