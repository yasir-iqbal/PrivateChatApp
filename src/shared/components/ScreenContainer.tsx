import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import { useTheme } from '../theme';

type ScreenContainerProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function ScreenContainer({ children, style }: ScreenContainerProps) {
  const theme = useTheme();
  const keyboardHeight = useKeyboardHeight();

  // Expo draws Android edge-to-edge, which stops the window being resized when
  // the IME opens — so adjustResize does nothing and KeyboardAvoidingView has
  // no Android behaviour that works without it. Pad by the measured keyboard
  // instead. iOS keeps using KeyboardAvoidingView, and applying both there
  // would lift the content twice.
  const androidKeyboardInset = Platform.OS === 'android' ? keyboardHeight : 0;
  const keyboardIsUp = androidKeyboardInset > 0;

  return (
    <SafeAreaView
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
      // The keyboard already covers the navigation bar that the bottom inset
      // reserves space for, so keeping both would leave a gap above it.
      edges={keyboardIsUp ? ['top'] : ['top', 'bottom']}
    >
      <KeyboardAvoidingView
        testID="screen-container"
        style={[
          styles.flex,
          { padding: theme.spacing.lg },
          style,
          // Last so it wins over any paddingBottom a caller passed in style.
          keyboardIsUp ? { paddingBottom: androidKeyboardInset } : null,
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {children}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
