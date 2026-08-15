import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../shared/theme';

type Props = {
  latitude: number;
  longitude: number;
  tint: string;
};

// A geo: URI hands off to whatever map app the user actually has, rather than
// embedding a map — which would mean a Maps SDK, an API key and billing for
// something that is one tap away already.
export function mapUrlFor(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export function LocationMessage({ latitude, longitude, tint }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => Linking.openURL(mapUrlFor(latitude, longitude))}
      accessibilityLabel="Open location in maps"
      style={styles.row}
    >
      <View style={[styles.pin, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Ionicons name="location" size={22} color={theme.colors.error} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: tint }]}>Location</Text>
        <Text style={[styles.coords, { color: tint }]} numberOfLines={1}>
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 180,
  },
  pin: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginLeft: 10,
    flexShrink: 1,
  },
  title: {
    fontWeight: '600',
    fontSize: 14,
  },
  coords: {
    fontSize: 12,
    opacity: 0.8,
  },
});
