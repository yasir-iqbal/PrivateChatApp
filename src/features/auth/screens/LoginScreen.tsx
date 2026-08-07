import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Controller } from 'react-hook-form';
import { ScrollView, Text } from 'react-native';

import { Button, ScreenContainer, TextField } from '../../../shared/components';
import { useTheme } from '../../../shared/theme';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';
import { useLogin } from '../hooks/useLogin';
import type { AuthStackParamList } from './AuthStackParamList';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const theme = useTheme();
  const { form, submit, isPending, error } = useLogin();
  const googleSignIn = useGoogleSignIn();
  const {
    control,
    formState: { errors },
  } = form;

  const combinedError = (error as Error | null) ?? (googleSignIn.error as Error | null);

  return (
    <ScreenContainer>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary }]}>Welcome back</Text>
        <Text
          style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: theme.spacing.xs, marginBottom: theme.spacing.lg }]}
        >
          Log in to continue your conversations.
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
              style={{ marginBottom: theme.spacing.md }}
              testID="login-email-input"
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <TextField
              label="Password"
              value={field.value}
              onChangeText={field.onChange}
              error={errors.password?.message}
              isPassword
              style={{ marginBottom: theme.spacing.md }}
              testID="login-password-input"
            />
          )}
        />

        {combinedError ? (
          <Text style={[theme.typography.caption, { color: theme.colors.error, marginBottom: theme.spacing.sm }]}>
            {combinedError.message}
          </Text>
        ) : null}

        <Button label="Log in" loading={isPending} onPress={submit} style={{ marginTop: theme.spacing.sm }} />
        <Button
          label="Continue with Google"
          variant="secondary"
          loading={googleSignIn.isPending}
          onPress={() => googleSignIn.mutate()}
          style={{ marginTop: theme.spacing.md }}
        />
        <Button
          label="Don't have an account? Sign up"
          variant="text"
          onPress={() => navigation.navigate('SignUp')}
          style={{ marginTop: theme.spacing.md }}
        />
      </ScrollView>
    </ScreenContainer>
  );
}
