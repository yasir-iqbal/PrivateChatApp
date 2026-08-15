import { Ionicons } from '@expo/vector-icons';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatDuration } from '../domain/message';

type Props = {
  uri: string;
  durationMs: number | null;
  width: number;
  height: number;
};

export function VideoMessage({ uri, durationMs, width, height }: Props) {
  const [started, setStarted] = useState(false);
  const player = useVideoPlayer({ uri }, (instance) => {
    instance.loop = false;
  });

  return (
    <View style={[styles.container, { width, height }]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={started}
      />
      {/* A poster-style overlay until the first play. Without it the bubble is
          a black rectangle, since there is no thumbnail to show. */}
      {!started ? (
        <Pressable
          style={styles.overlay}
          onPress={() => {
            setStarted(true);
            player.play();
          }}
          accessibilityLabel="Play video"
        >
          <View style={styles.playBadge}>
            <Ionicons name="play" size={26} color="#FFFFFF" />
          </View>
          {durationMs ? <Text style={styles.duration}>{formatDuration(durationMs)}</Text> : null}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFill as object,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  playBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  duration: {
    position: 'absolute',
    left: 8,
    top: 8,
    color: '#FFFFFF',
    fontSize: 12,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
});
