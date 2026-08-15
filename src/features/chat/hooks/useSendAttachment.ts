import { useMutation } from '@tanstack/react-query';
import { Alert } from 'react-native';

import {
  sendImageMessage,
  sendLocationMessage,
  sendVideoMessage,
  sendVoiceMessage,
} from '../domain/sendMediaMessage';

type Attachment =
  | { kind: 'image' | 'video'; source: 'library' | 'camera' }
  | { kind: 'location' }
  | { kind: 'voice'; uri: string; durationMs: number };

export function useSendAttachment(currentUid: string, otherUid: string) {
  const mutation = useMutation({
    mutationFn: async (attachment: Attachment): Promise<void> => {
      switch (attachment.kind) {
        case 'image':
          await sendImageMessage(currentUid, otherUid, attachment.source);
          return;
        case 'video':
          await sendVideoMessage(currentUid, otherUid, attachment.source);
          return;
        case 'location':
          await sendLocationMessage(currentUid, otherUid);
          return;
        case 'voice':
          await sendVoiceMessage(currentUid, otherUid, attachment.uri, attachment.durationMs);
      }
    },
  });

  // An action sheet rather than a row of buttons in the composer, which is
  // where both WhatsApp and the platform conventions put this choice.
  function chooseAttachment() {
    Alert.alert('Send', undefined, [
      { text: 'Photo — camera', onPress: () => mutation.mutate({ kind: 'image', source: 'camera' }) },
      { text: 'Photo — library', onPress: () => mutation.mutate({ kind: 'image', source: 'library' }) },
      { text: 'Video — camera', onPress: () => mutation.mutate({ kind: 'video', source: 'camera' }) },
      { text: 'Video — library', onPress: () => mutation.mutate({ kind: 'video', source: 'library' }) },
      { text: 'Location', onPress: () => mutation.mutate({ kind: 'location' }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function sendVoice(uri: string, durationMs: number) {
    mutation.mutate({ kind: 'voice', uri, durationMs });
  }

  return {
    chooseAttachment,
    sendVoice,
    isSending: mutation.isPending,
    error: mutation.error as Error | null,
  };
}
