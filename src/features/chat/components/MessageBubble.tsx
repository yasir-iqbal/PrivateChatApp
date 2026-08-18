import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../shared/theme';
import { DELETED_TEXT, type Message } from '../domain/message';
import type { MessageStatus } from '../domain/messageStatus';
import { LocationMessage, openLocation } from './LocationMessage';
import { MessageTicks } from './MessageTicks';
import { VideoMessage } from './VideoMessage';
import { VoiceMessage } from './VoiceMessage';

type Props = {
  message: Message;
  isMine: boolean;
  status: MessageStatus;
  onLongPress?: () => void;
};

const IMAGE_WIDTH = 240;
// Used until the real ratio is known, and as a floor so a very tall photo
// cannot take over the whole screen.
const FALLBACK_ASPECT_RATIO = 3 / 4;
const MIN_ASPECT_RATIO = 0.6;

function formatTime(millis: number): string {
  return new Date(millis).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, isMine, status, onLongPress }: Props) {
  const theme = useTheme();
  // A withdrawn message keeps its bubble but loses its content, so both sides
  // can see that something was removed.
  const isDeleted = message.deletedForEveryone;
  const hasMedia = message.mediaUrl !== null && !isDeleted;
  const isImage = message.type === 'image' && hasMedia;
  const isVideo = message.type === 'video' && hasMedia;
  const isVoice = message.type === 'voice' && hasMedia;
  const isLocation =
    !isDeleted &&
    message.type === 'location' &&
    message.latitude !== null &&
    message.longitude !== null;
  // Only image and video fill the bubble edge to edge; voice and location are
  // laid out like text and keep the padding.
  const isFramed = isImage || isVideo;
  const aspectRatio = Math.max(
    message.mediaAspectRatio ?? FALLBACK_ASPECT_RATIO,
    MIN_ASPECT_RATIO,
  );
  const mediaHeight = IMAGE_WIDTH / aspectRatio;
  const tint = isMine ? theme.colors.bubbleOutgoingText : theme.colors.bubbleIncomingText;
  // Tapping is owned by the bubble rather than the content, so there is only
  // ever one pressable competing for the touch.
  const handlePress = isLocation
    ? () => openLocation(message.latitude as number, message.longitude as number)
    : undefined;

  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
      <Pressable
        onPress={handlePress}
        onLongPress={onLongPress}
        delayLongPress={350}
        // Still pressable when only a long press is wired, so delete keeps
        // working on message kinds that have nothing to tap.
        disabled={!onLongPress && !handlePress}
        accessibilityLabel={isLocation ? 'Open location in maps' : undefined}
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleTheirs,
          isFramed && styles.bubbleImage,
          { backgroundColor: isMine ? theme.colors.bubbleOutgoing : theme.colors.bubbleIncoming },
        ]}
      >
        {isDeleted ? (
          <Text style={[theme.typography.body, styles.deleted, { color: theme.colors.bubbleMeta }]}>
            {DELETED_TEXT}
          </Text>
        ) : isImage ? (
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
          {isMine && !isDeleted ? (
            <View style={styles.ticks}>
              <MessageTicks status={status} />
            </View>
          ) : null}
        </View>
      </Pressable>
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
  deleted: {
    fontStyle: 'italic',
  },
  time: {
    fontSize: 11,
  },
  ticks: {
    marginLeft: 4,
  },
});
