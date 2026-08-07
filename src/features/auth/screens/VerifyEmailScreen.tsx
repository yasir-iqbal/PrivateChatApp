import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Button, ScreenContainer } from '../../../shared/components';
import { useTheme } from '../../../shared/theme';
import { useVerifyEmail } from '../hooks/useVerifyEmail';
import type { AuthUser } from '../domain/authUser';
import type { User } from '@react-native-firebase/auth';

type Props = {
  firebaseUser: User;
  authUser: AuthUser;
};

export function VerifyEmailScreen({ firebaseUser, authUser }: Props) {
  const theme = useTheme();
  const { resend, refresh, signOut } = useVerifyEmail(firebaseUser);

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.hero}>
        <Ionicons name="mail-unread-outline" size={56} color={theme.colors.primary} />
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary, marginTop: theme.spacing.lg, textAlign: 'center' }]}>
          Verify your email
        </Text>
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.sm },
          ]}
        >
          We sent a verification link to{'\n'}
          <Text style={{ color: theme.colors.textPrimary }}>{authUser.email}</Text>. Tap the link, then continue
          below.
        </Text>

        {resend.isSuccess ? (
          <Text style={[theme.typography.caption, { color: theme.colors.success, marginTop: theme.spacing.md }]}>
            Verification email sent.
          </Text>
        ) : null}
        {resend.error || refresh.error ? (
          <Text style={[theme.typography.caption, { color: theme.colors.error, marginTop: theme.spacing.md }]}>
            {((resend.error ?? refresh.error) as Error).message}
          </Text>
        ) : null}
      </View>

      <View>
        <Button label="I've verified — Continue" loading={refresh.isPending} onPress={() => refresh.mutate()} />
        <Button
          label="Resend email"
          variant="secondary"
          loading={resend.isPending}
          onPress={() => resend.mutate()}
          style={{ marginTop: theme.spacing.md }}
        />
        <Button
          label="Log out"
          variant="text"
          loading={signOut.isPending}
          onPress={() => signOut.mutate()}
          style={{ marginTop: theme.spacing.sm }}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
