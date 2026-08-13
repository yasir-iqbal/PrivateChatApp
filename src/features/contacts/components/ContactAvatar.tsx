import { Image, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../shared/theme';

type Props = {
  name: string;
  photoURL: string | null;
  size?: number;
};

function initialsOf(name: string): string {
  const [first = '', second = ''] = name.trim().split(/\s+/);
  // Falls back to the first two characters for single-word names and emails.
  return (first[0] ?? '?').concat(second[0] ?? first[1] ?? '').toUpperCase();
}

export function ContactAvatar({ name, photoURL, size = 48 }: Props) {
  const theme = useTheme();
  const shape = { width: size, height: size, borderRadius: size / 2 };

  if (photoURL) {
    return <Image source={{ uri: photoURL }} style={shape} accessibilityIgnoresInvertColors />;
  }

  return (
    <View style={[shape, styles.fallback, { backgroundColor: theme.colors.surfaceVariant }]}>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{initialsOf(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
