// A 1:1 conversation's ID is derived from its participants rather than
// generated, so both sides compute the same ID independently and can never
// create two conversations for the same pair by opening the chat at once.
//
// Group chats will not be able to use this (membership changes), so they will
// need generated IDs — the rest of the model is deliberately agnostic.
export function conversationIdFor(uidA: string, uidB: string): string {
  return [uidA, uidB].sort().join('_');
}

export type Conversation = {
  id: string;
  participants: string[];
  lastMessageText: string | null;
  lastMessageAt: number | null;
};
