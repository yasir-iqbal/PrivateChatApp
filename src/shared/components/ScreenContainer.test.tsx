import { act, render, screen } from '@testing-library/react-native';
import { Keyboard, Platform, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ScreenContainer } from './ScreenContainer';
import { ThemeProvider } from '../theme';

type Handler = (event: { endCoordinates: { height: number } }) => void;

// The navigation bar. Android reports the keyboard height with this already
// subtracted, so the padding the container ends up with is the sum of the two.
const BOTTOM_INSET = 24;

function renderContainer(style?: object) {
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: { top: 24, left: 0, right: 0, bottom: BOTTOM_INSET },
      }}
    >
      <ThemeProvider>
        <ScreenContainer style={style}>
          <Text>Hello</Text>
        </ScreenContainer>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

// The padded element is the KeyboardAvoidingView wrapping the children.
function paddingBottomOf(): unknown {
  const flattened = StyleSheet.flatten(screen.getByTestId('screen-container').props.style);
  return flattened?.paddingBottom;
}

describe('ScreenContainer', () => {
  let handlers: Record<string, Handler>;

  beforeEach(() => {
    handlers = {};
    jest.spyOn(Keyboard, 'addListener').mockImplementation(((event: string, handler: Handler) => {
      handlers[event] = handler;
      return { remove: jest.fn() };
    }) as unknown as typeof Keyboard.addListener);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders its children', () => {
    renderContainer();

    expect(screen.getByText('Hello')).toBeTruthy();
  });

  // Android edge-to-edge means the window is not resized for the keyboard, so
  // the container has to make the room itself.
  it('pads by the keyboard height on Android', () => {
    const original = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    try {
      renderContainer();
      act(() => handlers.keyboardDidShow?.({ endCoordinates: { height: 300 } }));

      expect(paddingBottomOf()).toBe(300 + BOTTOM_INSET);
    } finally {
      Object.defineProperty(Platform, 'OS', { value: original, configurable: true });
    }
  });

  // A caller's own paddingBottom must not win over the keyboard inset, or the
  // content would sit behind the keyboard again.
  it('overrides a caller-supplied paddingBottom while the keyboard is up', () => {
    const original = Platform.OS;
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    try {
      renderContainer({ paddingBottom: 4 });
      act(() => handlers.keyboardDidShow?.({ endCoordinates: { height: 300 } }));

      expect(paddingBottomOf()).toBe(300 + BOTTOM_INSET);
    } finally {
      Object.defineProperty(Platform, 'OS', { value: original, configurable: true });
    }
  });

  it('does not pad on iOS, where KeyboardAvoidingView handles it', () => {
    renderContainer();
    act(() => handlers.keyboardWillShow?.({ endCoordinates: { height: 300 } }));

    expect(paddingBottomOf()).not.toBe(300);
  });
});
