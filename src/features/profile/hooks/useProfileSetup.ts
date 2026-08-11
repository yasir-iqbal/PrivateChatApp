import { useMutation } from '@tanstack/react-query';
import type { User } from '@react-native-firebase/auth';

import { pickAndUploadAvatar } from '../domain/pickAndUploadAvatar';

export function useProfileSetup(user: User, refreshAuthState: () => Promise<void>) {
  const uploadAvatar = useMutation({
    mutationFn: async () => {
      const uploaded = await pickAndUploadAvatar(user);
      if (uploaded) {
        await refreshAuthState();
      }
      return uploaded;
    },
  });

  return { uploadAvatar };
}
