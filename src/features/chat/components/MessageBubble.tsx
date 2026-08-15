import { Image, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../shared/theme';
import type { Message } from '../domain/message';
import type { MessageStatus } from '../domain/messageStatus';
import { LocationMessage } from './LocationMessage';
import { MessageTicks } from './MessageTicks';
import { VideoMessage } from './VideoMessage';
import { VoiceMessage } from './VoiceMessage';

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
  const hasMedia = message.mediaUrl !== null;
  const isImage = message.type === 'image' && hasMedia;
  const isVideo = message.type === 'video' && hasMedia;
  const isVoice = message.type === 'voice' && hasMedia;
  const isLocation =
    message.type === 'location' && message.latitude !== null && message.longitude !== null;
  // Only image and video fill the bubble edge to edge; voice and location are
  // laid out like text and keep the padding.
  const isFramed = isImage || isVideo;
  const aspectRatio = Math.max(
    message.mediaAspectRatio ?? FALLBACK_ASPECT_RATIO,
    MIN_ASPECT_RATIO,
  );
  const mediaHeight = IMAGE_WIDTH / aspectRatio;
  const tint = isMine ? theme.colors.bubbleOutgoingText : theme.colors.bubbleIncomingText;

  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
      <View
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleTheirs,
          isFramed && styles.bubbleImage,
          { backgroundColor: isMine ? theme.colors.bubbleOutgoing : theme.colors.bubbleIncoming },
        ]}
      >
        {isImage ? (
          <Image
            source={{ uri: message.mediaUrl as string }}
            style={[styles.image, { width: IMAGE_WIDTH, height: mediaHeight }]}
            resizeMode="cover"
            accessibilityLabel="Photo"
          />
        ) : isVideo ? (
          <VideoMessage
            uri={message.mediaUrl as string}
            durationMs={message.durationMs}
            width={IMAGE_WIDTH}
            height={mediaHeight}
          />
        ) : isVoice ? (
          <VoiceMessage uri={message.mediaUrl as string} durationMs={message.durationMs} tint={tint} />
        ) : isLocation ? (
          <LocationMessage
            latitude={message.latitude as number}
            longitude={message.longitude as number}
            tint={tint}
          />
        ) : (
          <Text style={[theme.typography.body, { color: tint }]}>{message.text}</Text>
        )}

        {/* Time and ticks sit on one line at the bottom-right, inside the
            bubble, the way WhatsApp lays them out. */}
        <View style={[styles.meta, isFramed && styles.metaOnImage]}>
          <Text
            style={[
              styles.time,
              // Over a photo the meta needs its own contrast, since the image
              // behind it could be any colour.
              { color: isFramed ? '#FFFFFF' : theme.colors.bubbleMeta },
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
