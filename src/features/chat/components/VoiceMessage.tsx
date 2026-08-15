import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../../shared/theme';
import { formatDuration } from '../domain/message';

type Props = {
  uri: string;
  durationMs: number | null;
  tint: string;
};

export function VoiceMessage({ uri, durationMs, tint }: Props) {
  const theme = useTheme();
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);

  // While playing, count down from the recorded length so the bubble shows
  // remaining time the way a voice note usually does.
  const total = durationMs ?? (status.duration ? status.duration * 1000 : 0);
  const elapsed = status.currentTime * 1000;
  const label = status.playing ? formatDuration(Math.max(0, total - elapsed)) : formatDuration(total);

  const progress = total > 0 ? Math.min(1, elapsed / total) : 0;

  function toggle() {
    if (status.playing) {
      player.pause();
      return;
    }
    // Playback stays at the end once finished, so a second tap would do
    // nothing without rewinding first.
    if (status.didJustFinish || elapsed >= total) {
      player.seekTo(0);
    }
    player.play();
  }

  return (
    <View style={styles.row}>
      <Pressable
        onPress={toggle}
        hitSlop={8}
        accessibilityLabel={status.playing ? 'Pause voice message' : 'Play voice message'}
      >
        <Ionicons name={status.playing ? 'pause' : 'play'} size={24} color={tint} />
      </Pressable>
      <View style={styles.track}>
        <View style={[styles.trackBase, { backgroundColor: theme.colors.border }]} />
        <View style={[styles.trackFill, { backgroundColor: tint, width: `${progress * 100}%` }]} />
      </View>
      <Text style={[styles.duration, { color: tint }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 190,
  },
  track: {
    flex: 1,
    height: 3,
    marginHorizontal: 10,
    justifyContent: 'center',
  },
  trackBase: {
    ...StyleSheet.absoluteFill as object,
    borderRadius: 2,
  },
  trackFill: {
    height: 3,
    borderRadius: 2,
  },
  duration: {
    fontSize: 12,
    minWidth: 34,
    textAlign: 'right',
  },
});
