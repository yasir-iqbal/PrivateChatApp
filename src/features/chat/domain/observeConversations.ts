import { firestoreChatRepository, type ChatRepository } from '../data/chatRepository';

// One row of the chat list: who it's with, and what was said last. The
// contact's name and photo are resolved separately from the users
// collection so they stay live rather than being copied per conversation.
export type ConversationSummary = {
  id: string;
  otherUid: string;
  lastMessageText: string | null;
  lastMessageAt: number | null;
  lastMessageSenderId: string | null;
};

export function observeConversations(
  currentUid: string,
  onChange: (conversations: ConversationSummary[]) => void,
  onError: (error: Error) => void,
  repo: ChatRepository = firestoreChatRepository,
): () => void {
  return repo.observeConversations(
    currentUid,
    (records) => {
      const summaries = records
        .map((record) => ({
          id: record.id,
          otherUid: record.participants.find((participant) => participant !== currentUid) ?? '',
          lastMessageText: record.lastMessageText,
          lastMessageAt: record.lastMessageAt,
          lastMessageSenderId: record.lastMessageSenderId,
        }))
        // A conversation with no other participant is malformed; showing a
        // nameless row would be worse than omitting it.
        .filter((summary) => summary.otherUid !== '')
        // Sorted here rather than in the query: array-contains plus orderBy
        // needs a composite index, and this list is small by nature.
        .sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0));
      onChange(summaries);
    },
    onError,
  );
}
