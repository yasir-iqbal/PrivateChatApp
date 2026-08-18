import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { User } from '@react-native-firebase/auth';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, ScreenContainer } from '../../../shared/components';
import { useTheme } from '../../../shared/theme';
import type { AuthUser } from '../../auth/domain/authUser';
import { useSignOut } from '../../auth/hooks/useSignOut';
import { ContactAvatar } from '../../contacts/components/ContactAvatar';
import type { MainStackParamList } from '../../contacts/screens/MainStackParamList';
import { useEditDisplayName } from '../hooks/useEditDisplayName';
import { useProfileSetup } from '../hooks/useProfileSetup';

type Props = NativeStackScreenProps<MainStackParamList, 'Settings'> & {
  authUser: AuthUser;
  firebaseUser: User;
  refreshAuthState: () => Promise<void>;
};

export function SettingsScreen({ navigation, authUser, firebaseUser, refreshAuthState }: Props) {
  const theme = useTheme();
  const signOut = useSignOut();
  const { uploadAvatar } = useProfileSetup(firebaseUser, refreshAuthState);
  const name = useEditDisplayName(firebaseUser, authUser.displayName ?? '', refreshAuthState);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary, marginLeft: theme.spacing.md }]}>
          Settings
        </Text>
      </View>

      <View style={styles.avatarBlock}>
        <Pressable
          onPress={() => uploadAvatar.mutate()}
          disabled={uploadAvatar.isPending}
          accessibilityLabel="Change profile photo"
        >
          <ContactAvatar
            name={authUser.displayName || authUser.email || '?'}
            photoURL={authUser.photoURL}
            size={96}
          />
          <View style={[styles.cameraBadge, { backgroundColor: theme.colors.primary, borderColor: theme.colors.background }]}>
            {uploadAvatar.isPending ? (
              <ActivityIndicator size="small" color={theme.colors.onPrimary} />
            ) : (
              <Ionicons name="camera" size={16} color={theme.colors.onPrimary} />
            )}
          </View>
        </Pressable>
      </View>

      <Text style={[theme.typography.caption, styles.label, { color: theme.colors.textSecondary }]}>
        Name
      </Text>
      {name.isEditing ? (
        <View>
          <TextInput
            value={name.draft}
            onChangeText={name.setDraft}
            autoFocus
            style={[
              theme.typography.body,
              styles.input,
              {
                color: theme.colors.textPrimary,
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
            testID="settings-name-input"
          />
          <View style={styles.editActions}>
            <Button label="Cancel" variant="text" onPress={name.cancel} />
            <Button label="Save" onPress={name.save} loading={name.isSaving} style={styles.saveButton} />
          </View>
        </View>
      ) : (
        <Pressable style={styles.row} onPress={name.beginEditing} accessibilityLabel="Edit name">
          <Text style={[theme.typography.body, { color: theme.colors.textPrimary }]}>
            {authUser.displayName || 'Add a name'}
          </Text>
          <Ionicons name="pencil" size={18} color={theme.colors.icon} />
        </Pressable>
      )}

      <Text style={[theme.typography.caption, styles.label, { color: theme.colors.textSecondary }]}>
        Email
      </Text>
      {/* Read only: the address is the account identity and how contacts find
          you, so changing it is not a settings-screen action. */}
      <Text style={[theme.typography.body, styles.readOnly, { color: theme.colors.textSecondary }]}>
        {authUser.email}
      </Text>

      {name.error || uploadAvatar.error ? (
        <Text style={[theme.typography.caption, { color: theme.colors.error, marginTop: theme.spacing.sm }]}>
          {(name.error ?? (uploadAvatar.error as Error))?.message}
        </Text>
      ) : null}

      <View style={styles.spacer} />
      <Button label="Sign out" variant="secondary" onPress={() => signOut.mutate()} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarBlock: {
    alignItems: 'center',
    marginBottom: 28,
  },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 16,
  },
  readOnly: {
    paddingVertical: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  saveButton: {
    marginLeft: 12,
    paddingHorizontal: 24,
  },
  spacer: {
    flex: 1,
  },
});
