import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';

import { deleteMessageForEveryone, deleteMessageForMe } from '../domain/deleteMessage';
import { canDeleteForEveryone, type Message } from '../domain/message';

export function useDeleteMessage(currentUid: string, otherUid: string) {
  const mutation = useMutation({
    mutationFn: async (input: { scope: 'me' | 'everyone'; message: Message }) => {
      if (input.scope === 'everyone') {
        await deleteMessageForEveryone(currentUid, otherUid, input.message);
        return;
      }
      await deleteMessageForMe(currentUid, otherUid, input.message.id);
    },
  });

  // Delete is destructive and triggered by a long press that can happen by
  // accident, so it always goes through a confirmation.
  function confirmDelete(message: Message) {
    if (message.deletedForEveryone) return;

    const buttons: Parameters<typeof Alert.alert>[2] = [
      {
        text: 'Delete for me',
        style: 'destructive',
        onPress: () => mutation.mutate({ scope: 'me', message }),
      },
    ];

    // Only offered where it can actually succeed: your own message, inside the
    // window. Showing it otherwise would just produce an error on tap.
    if (canDeleteForEveryone(message, currentUid)) {
      buttons.push({
        text: 'Delete for everyone',
        style: 'destructive',
        onPress: () => mutation.mutate({ scope: 'everyone', message }),
      });
    }

    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert('Delete message', undefined, buttons);
  }

  return { confirmDelete, error: mutation.error as Error | null };
}
