import { Ionicons } from '@expo/vector-icons';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../shared/theme';

type Props = {
  latitude: number;
  longitude: number;
  // What the sender saw when they picked the spot. Absent on messages sent
  // before the picker existed, and when the geocoder had nothing.
  address: string | null;
  tint: string;
};

// Hands off to whatever map app the user has rather than embedding a map,
// which would mean a Maps SDK, an API key and billing for something that is
// one tap away already.
export function mapUrlFor(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export async function openLocation(latitude: number, longitude: number): Promise<void> {
  // openURL rejects when nothing can handle the link — an emulator with no
  // maps app, for instance. Swallowed so a tap is never an unhandled
  // rejection, which is how this failed silently before.
  try {
    await Linking.openURL(mapUrlFor(latitude, longitude));
  } catch (error) {
    console.warn('Could not open the location', error);
  }
}

// Presentational only. The press is handled by the bubble that wraps it:
// a Pressable inside the bubble's own Pressable competes for the touch
// responder on Android, and the inner one frequently never fires.
export function LocationMessage({ latitude, longitude, address, tint }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <View style={[styles.pin, { backgroundColor: theme.colors.surfaceVariant }]}>
        <Ionicons name="location" size={22} color={theme.colors.error} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: tint }]}>Location</Text>
        <Text style={[styles.coords, { color: tint }]} numberOfLines={2}>
          {address ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`}
        </Text>
        <Text style={[styles.hint, { color: tint }]}>Tap to open in Maps</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 190,
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
  hint: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 1,
  },
});
