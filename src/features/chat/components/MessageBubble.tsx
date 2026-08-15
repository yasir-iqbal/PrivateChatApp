import { Image, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../shared/theme';
import type { Message } from '../domain/message';
import type { MessageStatus } from '../domain/messageStatus';
import { MessageTicks } from './MessageTicks';

type Props = {
  message: Message;
  isMine: boolean;
  status: MessageStatus;
};

const IMAGE_WIDTH = 240;
// Used until the real ratio is known, and as a floor so a very tall photo
// cannot take over the whole screen.
const FALLBACK_ASPECT_RATIO = 3 / 4;
const MIN_ASPECT_RATIO = 0.6;

function formatTime(millis: number): string {
  return new Date(millis).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, isMine, status }: Props) {
  const theme = useTheme();
  const isImage = message.type === 'image' && message.mediaUrl !== null;
  const aspectRatio = Math.max(
    message.mediaAspectRatio ?? FALLBACK_ASPECT_RATIO,
    MIN_ASPECT_RATIO,
  );

  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
      <View
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleTheirs,
          isImage && styles.bubbleImage,
          { backgroundColor: isMine ? theme.colors.bubbleOutgoing : theme.colors.bubbleIncoming },
        ]}
      >
        {isImage ? (
          <Image
            source={{ uri: message.mediaUrl as string }}
            style={[styles.image, { width: IMAGE_WIDTH, height: IMAGE_WIDTH / aspectRatio }]}
            resizeMode="cover"
            accessibilityLabel="Photo"
          />
        ) : (
          <Text
            style={[
              theme.typography.body,
              { color: isMine ? theme.colors.bubbleOutgoingText : theme.colors.bubbleIncomingText },
            ]}
          >
            {message.text}
          </Text>
        )}

        {/* Time and ticks sit on one line at the bottom-right, inside the
            bubble, the way WhatsApp lays them out. */}
        <View style={[styles.meta, isImage && styles.metaOnImage]}>
          <Text
            style={[
              styles.time,
              // Over a photo the meta needs its own contrast, since the image
              // behind it could be any colour.
              { color: isImage ? '#FFFFFF' : theme.colors.bubbleMeta },
            ]}
          >
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
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 },
  },
  // A photo fills its bubble, so the padding that frames text is removed.
  bubbleImage: {
    padding: 3,
  },
  bubbleMine: {
    borderTopRightRadius: 2,
  },
  bubbleTheirs: {
    borderTopLeftRadius: 2,
  },
  image: {
    borderRadius: 6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  // Floated over the photo rather than pushing it up.
  metaOnImage: {
    position: 'absolute',
    right: 8,
    bottom: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  time: {
    fontSize: 11,
  },
  ticks: {
    marginLeft: 4,
  },
});
