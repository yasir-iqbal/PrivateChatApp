import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, ScreenContainer, TextField } from '../../../shared/components';
import { useTheme } from '../../../shared/theme';
import type { AuthUser } from '../../auth/domain/authUser';
import { sendInvite } from '../domain/sendInvite';
import { useAddContact } from '../hooks/useAddContact';
import type { MainStackParamList } from './MainStackParamList';

type Props = NativeStackScreenProps<MainStackParamList, 'AddContact'> & {
  authUser: AuthUser;
};

export function AddContactScreen({ navigation, authUser }: Props) {
  const theme = useTheme();
  const { form, submit, isPending, error, data } = useAddContact(authUser.uid, authUser.email);
  const {
    control,
    formState: { errors },
  } = form;

  // Leaving on success keeps the user's place: they came here from the list
  // and the new contact is what they want to see.
  useEffect(() => {
    if (data?.status === 'added') {
      navigation.goBack();
    }
  }, [data, navigation]);

  const inviterName = authUser.displayName?.trim() || authUser.email || 'Someone';

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </Pressable>
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary, marginLeft: theme.spacing.md }]}>
          New contact
        </Text>
      </View>

      <Text
        style={[
          theme.typography.body,
          { color: theme.colors.textSecondary, marginBottom: theme.spacing.lg },
        ]}
      >
        Enter the email address they signed up with.
      </Text>

      <Controller
        control={control}
        name="email"
        render={({ field }) => (
          <TextField
            label="Email"
            value={field.value}
            onChangeText={field.onChange}
            error={errors.email?.message}
            keyboardType="email-address"
            autoCorrect={false}
            style={{ marginBottom: theme.spacing.md }}
            testID="add-contact-email-input"
          />
        )}
      />

      {error ? (
        <Text style={[theme.typography.caption, { color: theme.colors.error, marginBottom: theme.spacing.sm }]}>
          {(error as Error).message}
        </Text>
      ) : null}

      {data?.status === 'self' ? (
        <Text style={[theme.typography.caption, { color: theme.colors.error, marginBottom: theme.spacing.sm }]}>
          That is your own email address.
        </Text>
      ) : null}

      <Button label="Add contact" onPress={submit} loading={isPending} />

      {data?.status === 'not-found' ? (
        <View style={[styles.inviteCard, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text style={[theme.typography.body, { color: theme.colors.textPrimary }]}>
            No account for {data.email}
          </Text>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
            ]}
          >
            They have not signed up yet. Send them an invite and add them once they do.
          </Text>
          <Button
            label="Send invite"
            variant="text"
            onPress={() => sendInvite(inviterName)}
            style={{ marginTop: theme.spacing.sm, alignSelf: 'flex-start' }}
          />
        </View>
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inviteCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
  },
});
