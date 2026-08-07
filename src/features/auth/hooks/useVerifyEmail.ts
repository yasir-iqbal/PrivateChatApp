import { useMutation } from '@tanstack/react-query';
import type { User } from '@react-native-firebase/auth';

import { logOut } from '../domain/logOut';
import { refreshAuthUser } from '../domain/refreshAuthUser';
import { resendVerificationEmail } from '../domain/resendVerificationEmail';

export function useVerifyEmail(user: User | null) {
  const resend = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('No signed-in user.');
      return resendVerificationEmail(user);
    },
  });

  const refresh = useMutation({
    mutationFn: () => {
      if (!user) throw new Error('No signed-in user.');
      return refreshAuthUser(user);
    },
  });

  const signOut = useMutation({
    mutationFn: () => logOut(),
  });

  return { resend, refresh, signOut };
}
