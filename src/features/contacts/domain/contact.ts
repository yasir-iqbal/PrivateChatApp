import type { UserProfile } from '../../profile/data/userProfileRepository';

// A contact edge joined with the contact's live profile.
export type Contact = UserProfile & {
  addedAt: number | null;
};

// Falls back through the fields most likely to be set, so a contact who never
// set a display name still shows something recognisable rather than blank.
export function contactDisplayName(contact: Pick<Contact, 'displayName' | 'email'>): string {
  return contact.displayName?.trim() || contact.email;
}
