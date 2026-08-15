import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../../shared/theme';

export type AttachmentChoice =
  | { kind: 'image'; source: 'camera' | 'library' }
  | { kind: 'video'; source: 'camera' | 'library' }
  | { kind: 'location' };

type Props = {
  visible: boolean;
  onClose: () => void;
  onChoose: (choice: AttachmentChoice) => void;
};

type Option = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  colour: string;
  choice: AttachmentChoice;
};

// Fixed colours rather than theme tokens: these are identity for each action,
// the way WhatsApp's are, and stay recognisable in both light and dark.
const OPTIONS: Option[] = [
  { label: 'Camera', icon: 'camera', colour: '#EC407A', choice: { kind: 'image', source: 'camera' } },
  { label: 'Gallery', icon: 'images', colour: '#AB47BC', choice: { kind: 'image', source: 'library' } },
  { label: 'Record', icon: 'videocam', colour: '#EF5350', choice: { kind: 'video', source: 'camera' } },
  { label: 'Video', icon: 'film', colour: '#5C6BC0', choice: { kind: 'video', source: 'library' } },
  { label: 'Location', icon: 'location', colour: '#26A69A', choice: { kind: 'location' } },
];

export function AttachmentSheet({ visible, onClose, onChoose }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  function choose(choice: AttachmentChoice) {
    // Closed first so the sheet is not still on screen behind the system
    // camera or picker it just opened.
    onClose();
    onChoose(choice);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Tapping outside dismisses, which is the expectation for a sheet and
          the only way out on iOS, where there is no back button. */}
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close attachments" />
      <View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.colors.surface,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
          },
        ]}
      >
        <View style={[styles.grabber, { backgroundColor: theme.colors.border }]} />
        <View style={styles.grid}>
          {OPTIONS.map((option) => (
            <Pressable
              key={option.label}
              style={styles.option}
              onPress={() => choose(option.choice)}
              accessibilityLabel={option.label}
            >
              <View style={[styles.bubble, { backgroundColor: option.colour }]}>
                <Ionicons name={option.icon} size={26} color="#FFFFFF" />
              </View>
              <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...(StyleSheet.absoluteFill as object),
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  grabber: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    marginBottom: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  // Three per row, matching WhatsApp's grid; a fifth item simply wraps.
  option: {
    width: '33.33%',
    alignItems: 'center',
    marginBottom: 20,
  },
  bubble: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: 6,
    fontSize: 12,
  },
});
