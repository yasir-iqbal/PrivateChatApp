import { useEffect } from 'react';
import { AppState } from 'react-native';

import { HEARTBEAT_INTERVAL_MS } from '../domain/presence';
import { reportPresence } from '../domain/reportPresence';

// Beats while the app is in the foreground and stops when it is backgrounded,
// which is what lets the other side notice you have gone: there is no
// disconnect event to rely on, so going quiet *is* the signal.
export function usePresenceReporter(uid: string | undefined, email: string | null | undefined) {
  useEffect(() => {
    if (!uid || !email) return;

    let timer: ReturnType<typeof setInterval> | undefined;

    const beat = () => {
      reportPresence(uid, email).catch((error) => {
        // A missed beat only delays the other side seeing us as online.
        console.warn('Failed to report presence', error);
      });
    };

    const start = () => {
      if (timer) return;
      beat();
      timer = setInterval(beat, HEARTBEAT_INTERVAL_MS);
    };

    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = undefined;
    };

    start();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') start();
      else stop();
    });

    return () => {
      stop();
      subscription.remove();
    };
  }, [uid, email]);
}
