import { useEffect, useState } from 'react';

import { observeMessages, toChronological } from '../domain/observeMessages';
import type { Message } from '../domain/message';

export type MessagesState = {
  messages: Message[];
  loading: boolean;
  error: Error | null;
};

// A live listener rather than a query: messages have to arrive without the
// recipient doing anything, which is the whole point of a chat.
export function useMessages(currentUid: string, otherUid: string): MessagesState {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const unsubscribe = observeMessages(
      currentUid,
      otherUid,
      (incoming) => {
        setMessages(toChronological(incoming));
        setLoading(false);
      },
      (listenerError) => {
        setError(listenerError);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [currentUid, otherUid]);

  return { messages, loading, error };
}
