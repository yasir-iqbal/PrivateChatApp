import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Controller } from 'react-hook-form';
import { ScrollView, Text } from 'react-native';

import { Button, ScreenContainer, TextField } from '../../../shared/components';
import { useTheme } from '../../../shared/theme';
import { useSignUp } from '../hooks/useSignUp';
import type { AuthStackParamList } from './AuthStackParamList';

type Props = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

export function SignUpScreen({ navigation }: Props) {
  const theme = useTheme();
  const { form, submit, isPending, error } = useSignUp();
  const {
    control,
    formState: { errors },
  } = form;

  return (
    <ScreenContainer>
      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary }]}>Create account</Text>
        <Text
          style={[theme.typography.body, { color: theme.colors.textSecondary, marginTop: theme.spacing.xs, marginBottom: theme.spacing.lg }]}
        >
          We'll send a verification link to your email.
        </Text>

        <Controller
          control={control}
          name="displayName"
          render={({ field }) => (
            <TextField
              label="Name"
              value={field.value}
              onChangeText={field.onChange}
              error={errors.displayName?.message}
              autoCapitalize="words"
              style={{ marginBottom: theme.spacing.md }}
              testID="signup-name-input"
            />
          )}
        />
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
              testID="signup-email-input"
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
              testID="signup-password-input"
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field }) => (
            <TextField
              label="Confirm password"
              value={field.value}
              onChangeText={field.onChange}
              error={errors.confirmPassword?.message}
              isPassword
              style={{ marginBottom: theme.spacing.md }}
              testID="signup-confirm-password-input"
            />
          )}
        />

        {error ? (
          <Text style={[theme.typography.caption, { color: theme.colors.error, marginBottom: theme.spacing.sm }]}>
            {(error as Error).message}
          </Text>
        ) : null}

        <Button label="Sign up" loading={isPending} onPress={submit} style={{ marginTop: theme.spacing.sm }} />
        <Button
          label="Already have an account? Log in"
          variant="text"
          onPress={() => navigation.navigate('Login')}
          style={{ marginTop: theme.spacing.md }}
        />
      </ScrollView>
    </ScreenContainer>
  );
}
