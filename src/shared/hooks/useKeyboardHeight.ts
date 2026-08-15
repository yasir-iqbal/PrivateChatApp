import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

// Height of the on-screen keyboard, 0 when hidden.
//
// Needed because Expo draws Android edge-to-edge, and under edge-to-edge the
// window is no longer resized when the IME opens — so the manifest's
// adjustResize does nothing and the keyboard simply covers whatever is at the
// bottom of the screen. Measuring it here lets a screen pad itself instead.
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    // iOS fires the "will" events early enough to animate with the keyboard;
    // Android only has the "did" pair.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, (event) => {
      setHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener(hideEvent, () => setHeight(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}
