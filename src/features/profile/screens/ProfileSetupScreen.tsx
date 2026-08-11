import { Ionicons } from '@expo/vector-icons';
import type { User } from '@react-native-firebase/auth';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, ScreenContainer } from '../../../shared/components';
import { useTheme } from '../../../shared/theme';
import { useProfileSetup } from '../hooks/useProfileSetup';

type Props = {
  firebaseUser: User;
  refreshAuthState: () => Promise<void>;
  // Owned by the navigator, which gates on the same skip state — a second
  // useProfileSetupStatus() here would only update this screen's own copy.
  onSkip: () => void;
};

export function ProfileSetupScreen({ firebaseUser, refreshAuthState, onSkip }: Props) {
  const theme = useTheme();
  const { uploadAvatar } = useProfileSetup(firebaseUser, refreshAuthState);

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.hero}>
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary, textAlign: 'center' }]}>
          Add a profile photo
        </Text>
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.sm },
          ]}
        >
          Help people recognize you. You can always change this later.
        </Text>

        <Pressable
          onPress={() => uploadAvatar.mutate()}
          disabled={uploadAvatar.isPending}
          style={{ marginTop: theme.spacing.xl }}
        >
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.border },
            ]}
          >
            {uploadAvatar.isPending ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : (
              <Ionicons name="person" size={56} color={theme.colors.icon} />
            )}
          </View>
          <View style={[styles.cameraBadge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.background }]}>
            <Ionicons name="camera" size={18} color={theme.colors.onPrimary} />
          </View>
        </Pressable>

        {uploadAvatar.error ? (
          <Text style={[theme.typography.caption, { color: theme.colors.error, marginTop: theme.spacing.md }]}>
            {(uploadAvatar.error as Error).message}
          </Text>
        ) : null}
      </View>

      <View>
        <Button
          label="Choose photo"
          loading={uploadAvatar.isPending}
          onPress={() => uploadAvatar.mutate()}
        />
        <Button
          label="Skip for now"
          variant="text"
          onPress={onSkip}
          style={{ marginTop: theme.spacing.sm }}
        />
      </View>
    </ScreenContainer>
  );
}

const AVATAR_SIZE = 128;

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
