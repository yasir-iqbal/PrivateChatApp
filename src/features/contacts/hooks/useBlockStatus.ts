import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { blockContact, isBlocked, observeBlocked, unblockContact } from '../domain/blocking';

export function useBlockStatus(currentUid: string, otherUid: string) {
  const [blockedUids, setBlockedUids] = useState<string[]>([]);

  useEffect(() => {
    return observeBlocked(currentUid, setBlockedUids);
  }, [currentUid]);

  const blocked = isBlocked(blockedUids, otherUid);

  const mutation = useMutation({
    mutationFn: (next: boolean) =>
      next ? blockContact(currentUid, otherUid) : unblockContact(currentUid, otherUid),
  });

  // Blocking is not destructive but it is consequential and easy to hit by
  // accident from a menu, so it is confirmed. Unblocking is not.
  function toggle(contactName: string) {
    if (!blocked) {
      Alert.alert(
        `Block ${contactName}?`,
        'They will not be able to send you messages. They are not told that you blocked them.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Block', style: 'destructive', onPress: () => mutation.mutate(true) },
        ],
      );
      return;
    }
    mutation.mutate(false);
  }

  return { blocked, toggle, isPending: mutation.isPending, error: mutation.error as Error | null };
}
