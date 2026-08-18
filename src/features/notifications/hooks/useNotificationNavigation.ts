import { useEffect } from 'react';

import { firebasePushRepository } from '../data/pushRepository';
import { toNotificationTarget, type NotificationTarget } from '../domain/notificationTarget';

// Opens the conversation a notification refers to, both when one is tapped
// while the app is running and when tapping it launched the app.
export function useNotificationNavigation(
  enabled: boolean,
  onOpen: (target: NotificationTarget) => void,
) {
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    // The launch notification is consumed once; ignoring it would drop the
    // very case where the user tapped a notification to get here.
    firebasePushRepository
      .getInitialNotification()
      .then((data) => {
        if (cancelled) return;
        const target = toNotificationTarget(data);
        if (target) onOpen(target);
      })
      .catch((error) => {
        console.warn('Failed to read the launch notification', error);
      });

    const unsubscribe = firebasePushRepository.onNotificationOpened((data) => {
      const target = toNotificationTarget(data);
      if (target) onOpen(target);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onOpen is a
    // navigation callback that changes identity on every render.
  }, [enabled]);
}
