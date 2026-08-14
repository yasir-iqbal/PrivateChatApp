import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../../shared/theme';
import type { MessageStatus } from '../domain/messageStatus';

const SIZE = 15;

// One tick for sent, two for delivered, two blue for read, a clock while the
// write is still local. Only ever shown on your own messages.
export function MessageTicks({ status }: { status: MessageStatus }) {
  const theme = useTheme();

  if (status === 'pending') {
    return (
      <Ionicons
        name="time-outline"
        size={SIZE - 2}
        color={theme.colors.bubbleMeta}
        accessibilityLabel="Sending"
      />
    );
  }

  const color = status === 'read' ? theme.colors.tickRead : theme.colors.tick;
  const label = status === 'read' ? 'Read' : status === 'delivered' ? 'Delivered' : 'Sent';

  if (status === 'sent') {
    return <Ionicons name="checkmark" size={SIZE} color={color} accessibilityLabel={label} />;
  }

  // Two overlapping checks, offset so they read as WhatsApp's double tick
  // rather than one mark on top of another.
  return (
    <View style={styles.double} accessibilityLabel={label}>
      <Ionicons name="checkmark" size={SIZE} color={color} style={styles.back} />
      <Ionicons name="checkmark" size={SIZE} color={color} style={styles.front} />
    </View>
  );
}

const styles = StyleSheet.create({
  double: {
    width: SIZE + 5,
    height: SIZE,
    justifyContent: 'center',
  },
  back: {
    position: 'absolute',
    left: 0,
  },
  front: {
    position: 'absolute',
    left: 5,
  },
});
