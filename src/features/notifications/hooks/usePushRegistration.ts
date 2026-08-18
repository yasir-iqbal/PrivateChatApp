import { useEffect, useRef } from 'react';

import { firebasePushRepository } from '../data/pushRepository';
import { registerForPush, unregisterFromPush } from '../domain/pushRegistration';

// Registers this device while someone is signed in, and removes the token on
// sign out so the phone stops receiving that account's messages.
export function usePushRegistration(uid: string | undefined) {
  // Remembered so sign-out can remove the exact token this device registered,
  // by which point the uid is already gone from the auth state.
  const registered = useRef<{ uid: string; token: string } | null>(null);

  useEffect(() => {
    if (!uid) {
      const previous = registered.current;
      registered.current = null;
      if (previous) {
        unregisterFromPush(previous.uid, previous.token).catch((error) => {
          console.warn('Failed to unregister push token', error);
        });
      }
      return;
    }

    let cancelled = false;

    registerForPush(uid)
      .then((result) => {
        if (cancelled || result.status !== 'registered') return;
        registered.current = { uid, token: result.token };
      })
      .catch((error) => {
        // Not being reachable by push must never stop the app working.
        console.warn('Failed to register for push', error);
      });

    // FCM rotates tokens; a stale one silently stops delivering.
    const unsubscribe = firebasePushRepository.onTokenRefresh((token) => {
      registered.current = { uid, token };
      firebasePushRepository.saveToken(uid, token).catch((error) => {
        console.warn('Failed to save refreshed push token', error);
      });
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [uid]);
}
