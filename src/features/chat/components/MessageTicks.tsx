import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../../shared/theme';
import type { MessageStatus } from '../domain/messageStatus';

const SIZE = 15;

const LABELS: Record<MessageStatus, string> = {
  sending: 'Sending',
  sent: 'Sent',
  delivered: 'Delivered',
  seen: 'Seen',
};

// A clock while the write is local, one tick once it reaches the server, two
// once the recipient's app has it, two blue once they have opened the chat.
// Only ever shown on your own messages.
export function MessageTicks({ status }: { status: MessageStatus }) {
  const theme = useTheme();

  if (status === 'sending') {
    return (
      <Ionicons
        name="time-outline"
        size={SIZE - 2}
        color={theme.colors.bubbleMeta}
        accessibilityLabel={LABELS.sending}
      />
    );
  }

  const color = status === 'seen' ? theme.colors.tickRead : theme.colors.tick;

  if (status === 'sent') {
    return (
      <Ionicons name="checkmark" size={SIZE} color={color} accessibilityLabel={LABELS.sent} />
    );
  }

  // Two overlapping checks, offset so they read as a double tick rather than
  // one mark drawn on top of another.
  return (
    <View style={styles.double} accessibilityLabel={LABELS[status]}>
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
