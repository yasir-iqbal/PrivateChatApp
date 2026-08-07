import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';

import { GOOGLE_WEB_CLIENT_ID } from '../../../shared/config/googleSignIn';
import { configureGoogleSignIn } from '../domain/configureGoogleSignIn';
import { signInWithGoogle } from '../domain/signInWithGoogle';

export function useGoogleSignIn() {
  useEffect(() => {
    if (GOOGLE_WEB_CLIENT_ID) {
      configureGoogleSignIn(GOOGLE_WEB_CLIENT_ID);
    }
  }, []);

  return useMutation({
    mutationFn: () => signInWithGoogle(),
  });
}
