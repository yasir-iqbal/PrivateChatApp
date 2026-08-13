import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

import { sendMessage } from '../domain/sendMessage';
import { isSendableMessage } from '../domain/message';

export function useSendMessage(currentUid: string, otherUid: string) {
  const [draft, setDraft] = useState('');

  const mutation = useMutation({
    mutationFn: (text: string) => sendMessage(currentUid, otherUid, text),
  });

  function send() {
    if (!isSendableMessage(draft)) return;
    const text = draft;
    // Cleared before the write resolves: Firestore queues the write locally
    // and the listener echoes it back immediately, so the message is already
    // on screen. Waiting would leave the sent text sitting in the input.
    setDraft('');
    mutation.mutate(text, {
      // Put it back so the user doesn't lose what they typed.
      onError: () => setDraft((current) => (current === '' ? text : current)),
    });
  }

  return {
    draft,
    setDraft,
    send,
    canSend: isSendableMessage(draft),
    error: mutation.error as Error | null,
  };
}
