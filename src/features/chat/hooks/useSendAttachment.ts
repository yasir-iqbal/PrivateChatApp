import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import type { AttachmentChoice } from '../components/AttachmentSheet';
import {
  sendImageMessage,
  sendLocationMessage,
  sendVideoMessage,
  sendVoiceMessage,
} from '../domain/sendMediaMessage';

type Attachment =
  | Extract<AttachmentChoice, { kind: 'image' | 'video' }>
  | { kind: 'voice'; uri: string; durationMs: number }
  | { kind: 'location'; latitude: number; longitude: number; address: string | null };

export function useSendAttachment(currentUid: string, otherUid: string) {
  const [isSheetOpen, setSheetOpen] = useState(false);

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
          await sendLocationMessage(
            currentUid,
            otherUid,
            attachment.latitude,
            attachment.longitude,
            attachment.address,
          );
          return;
        case 'voice':
          await sendVoiceMessage(currentUid, otherUid, attachment.uri, attachment.durationMs);
      }
    },
  });

  return {
    isSheetOpen,
    openSheet: () => setSheetOpen(true),
    closeSheet: () => setSheetOpen(false),
    choose: (choice: AttachmentChoice) => {
      // Location is the one choice that opens a screen instead of sending.
      if (choice.kind === 'location') return;
      mutation.mutate(choice);
    },
    sendLocation: (latitude: number, longitude: number, address: string | null) =>
      mutation.mutate({ kind: 'location', latitude, longitude, address }),
    sendVoice: (uri: string, durationMs: number) =>
      mutation.mutate({ kind: 'voice', uri, durationMs }),
    isSending: mutation.isPending,
    error: mutation.error as Error | null,
  };
}
