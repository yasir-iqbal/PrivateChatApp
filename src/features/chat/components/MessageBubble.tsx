import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../shared/theme';
import type { Message } from '../domain/message';
import type { MessageStatus } from '../domain/messageStatus';
import { MessageTicks } from './MessageTicks';

type Props = {
  message: Message;
  isMine: boolean;
  status: MessageStatus;
};

function formatTime(millis: number): string {
  return new Date(millis).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, isMine, status }: Props) {
  const theme = useTheme();

  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
      <View
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleTheirs,
          { backgroundColor: isMine ? theme.colors.bubbleOutgoing : theme.colors.bubbleIncoming },
        ]}
      >
        <Text
          style={[
            theme.typography.body,
            { color: isMine ? theme.colors.bubbleOutgoingText : theme.colors.bubbleIncomingText },
          ]}
        >
          {message.text}
        </Text>
        {/* Time and ticks sit on one line at the bottom-right, inside the
            bubble, the way WhatsApp lays them out. */}
        <View style={styles.meta}>
          <Text style={[styles.time, { color: theme.colors.bubbleMeta }]}>
            {formatTime(message.sentAt ?? message.clientSentAt)}
          </Text>
          {isMine ? (
            <View style={styles.ticks}>
              <MessageTicks status={status} />
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginVertical: 2,
    paddingHorizontal: 8,
  },
  rowMine: {
    justifyContent: 'flex-end',
  },
  rowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 9,
    paddingTop: 6,
    paddingBottom: 5,
    borderRadius: 8,
    // Lifted off the wallpaper the way WhatsApp bubbles are.
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
  },
  // The squared-off corner points at the speaker, standing in for the tail.
  bubbleMine: {
    borderTopRightRadius: 2,
  },
  bubbleTheirs: {
    borderTopLeftRadius: 2,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  time: {
    fontSize: 11,
  },
  ticks: {
    marginLeft: 4,
  },
});
