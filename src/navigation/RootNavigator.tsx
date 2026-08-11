import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAuthState } from '../features/auth/hooks/useAuthState';
import { VerifyEmailScreen } from '../features/auth/screens/VerifyEmailScreen';
import { useProfileSetupStatus } from '../features/profile/hooks/useProfileSetupStatus';
import { ProfileSetupScreen } from '../features/profile/screens/ProfileSetupScreen';
import { useTheme } from '../shared/theme';
import { AuthNavigator } from './AuthNavigator';

type RootStackParamList = {
  Auth: undefined;
  VerifyEmail: undefined;
  ProfileSetup: undefined;
  SignedIn: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Temporary landing screen for authenticated + verified users. Replace with
// the Dashboard feature once it's built.
function SignedInPlaceholderScreen() {
  const theme = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
      <Text style={{ color: theme.colors.textPrimary }}>Signed in — Dashboard coming soon</Text>
    </View>
  );
}

export function RootNavigator() {
  const theme = useTheme();
  const { firebaseUser, authUser, initializing, refresh } = useAuthState();

  const needsProfileStatus = !!authUser?.emailVerified && !authUser?.photoURL;
  const { hasSkipped, loading: profileStatusLoading, markSkipped } = useProfileSetupStatus(
    needsProfileStatus ? authUser?.uid : undefined,
  );

  if (initializing || (needsProfileStatus && profileStatusLoading)) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: theme.isDark,
        colors: {
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.surface,
          text: theme.colors.textPrimary,
          border: theme.colors.border,
          notification: theme.colors.primary,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '900' },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!authUser ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : !authUser.emailVerified ? (
          <Stack.Screen name="VerifyEmail">
            {() => <VerifyEmailScreen firebaseUser={firebaseUser!} authUser={authUser} refreshAuthState={refresh} />}
          </Stack.Screen>
        ) : needsProfileStatus && !hasSkipped ? (
          <Stack.Screen name="ProfileSetup">
            {() => (
              <ProfileSetupScreen
                firebaseUser={firebaseUser!}
                refreshAuthState={refresh}
                onSkip={markSkipped}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="SignedIn" component={SignedInPlaceholderScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
