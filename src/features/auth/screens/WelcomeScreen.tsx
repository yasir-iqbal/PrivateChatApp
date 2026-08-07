import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, ScreenContainer } from '../../../shared/components';
import { useTheme } from '../../../shared/theme';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';
import type { AuthStackParamList } from './AuthStackParamList';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const theme = useTheme();
  const googleSignIn = useGoogleSignIn();

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.hero}>
        <View style={[styles.logoCircle, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="chatbubble-ellipses" size={40} color={theme.colors.onPrimary} />
        </View>
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary, marginTop: theme.spacing.lg }]}>
          PrivateChat
        </Text>
        <Text
          style={[
            theme.typography.body,
            { color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing.sm },
          ]}
        >
          Simple, private messaging with the people you trust.
        </Text>
      </View>

      <View style={styles.actions}>
        {googleSignIn.error ? (
          <Text style={[theme.typography.caption, { color: theme.colors.error, marginBottom: theme.spacing.sm }]}>
            {(googleSignIn.error as Error).message}
          </Text>
        ) : null}
        <Button
          label="Continue with Google"
          variant="secondary"
          loading={googleSignIn.isPending}
          onPress={() => googleSignIn.mutate()}
        />
        <Button
          label="Sign up with email"
          variant="primary"
          style={{ marginTop: theme.spacing.md }}
          onPress={() => navigation.navigate('SignUp')}
        />
        <Button
          label="I already have an account"
          variant="text"
          style={{ marginTop: theme.spacing.sm }}
          onPress={() => navigation.navigate('Login')}
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
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    paddingBottom: 8,
  },
});
