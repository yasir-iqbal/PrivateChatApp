import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';

import { sendImageMessage } from '../domain/sendMessage';

export function useSendImage(currentUid: string, otherUid: string) {
  const mutation = useMutation({
    mutationFn: (source: 'library' | 'camera') => sendImageMessage(currentUid, otherUid, source),
  });

  // An action sheet rather than two buttons in the composer, which is where
  // both WhatsApp and the platform conventions put this choice.
  function chooseAndSend() {
    Alert.alert('Send photo', undefined, [
      { text: 'Take photo', onPress: () => mutation.mutate('camera') },
      { text: 'Choose from library', onPress: () => mutation.mutate('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return {
    chooseAndSend,
    isSending: mutation.isPending,
    error: mutation.error as Error | null,
  };
}
