import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuthState } from '../features/auth/hooks/useAuthState';
import { VerifyEmailScreen } from '../features/auth/screens/VerifyEmailScreen';
import { useProfileSetupStatus } from '../features/profile/hooks/useProfileSetupStatus';
import { usePushRegistration } from '../features/notifications/hooks/usePushRegistration';
import { usePresenceReporter } from '../features/presence/hooks/usePresenceReporter';
import { useSyncUserProfile } from '../features/profile/hooks/useSyncUserProfile';
import { ProfileSetupScreen } from '../features/profile/screens/ProfileSetupScreen';
import { useTheme } from '../shared/theme';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

type RootStackParamList = {
  Auth: undefined;
  VerifyEmail: undefined;
  ProfileSetup: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const theme = useTheme();
  const { firebaseUser, authUser, initializing, refresh } = useAuthState();

  // Publishes the user into the users collection so contacts can find them.
  useSyncUserProfile(authUser);
  // Mounted here rather than on a screen so the heartbeat continues wherever
  // the user navigates.
  usePresenceReporter(authUser?.uid, authUser?.email);
  // Registers this device for push while signed in, and drops the token on
  // sign out so the phone stops receiving that account's messages.
  usePushRegistration(authUser?.uid);

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
          <Stack.Screen name="Main">{() => (
              <MainNavigator
                authUser={authUser}
                firebaseUser={firebaseUser!}
                refreshAuthState={refresh}
              />
            )}</Stack.Screen>
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
