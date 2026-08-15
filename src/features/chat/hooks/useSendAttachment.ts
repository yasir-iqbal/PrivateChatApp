import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import type { AttachmentChoice } from '../components/AttachmentSheet';
import {
  sendImageMessage,
  sendLocationMessage,
  sendVideoMessage,
  sendVoiceMessage,
} from '../domain/sendMediaMessage';

type Attachment = AttachmentChoice | { kind: 'voice'; uri: string; durationMs: number };

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
          await sendLocationMessage(currentUid, otherUid);
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
    choose: (choice: AttachmentChoice) => mutation.mutate(choice),
    sendVoice: (uri: string, durationMs: number) =>
      mutation.mutate({ kind: 'voice', uri, durationMs }),
    isSending: mutation.isPending,
    error: mutation.error as Error | null,
  };
}
