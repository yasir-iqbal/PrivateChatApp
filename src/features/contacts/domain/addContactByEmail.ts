import {
  firestoreUserProfileRepository,
  normalizeEmail,
  type UserProfile,
  type UserProfileRepository,
} from '../../profile/data/userProfileRepository';
import { firestoreContactsRepository, type ContactsRepository } from '../data/contactsRepository';

export type AddContactResult =
  | { status: 'added'; contact: UserProfile }
  // Nobody has registered this address — the caller offers an invite instead
  // of reporting a failure, since this is the expected case for a new user.
  | { status: 'not-found'; email: string }
  | { status: 'self' };

export async function addContactByEmail(
  ownerUid: string,
  ownerEmail: string | null,
  email: string,
  profileRepo: UserProfileRepository = firestoreUserProfileRepository,
  contactsRepo: ContactsRepository = firestoreContactsRepository,
): Promise<AddContactResult> {
  const normalized = normalizeEmail(email);

  // Checked before the lookup so it stays correct even if the user's own
  // profile document hasn't synced yet.
  if (ownerEmail && normalizeEmail(ownerEmail) === normalized) {
    return { status: 'self' };
  }

  const profile = await profileRepo.findByEmail(normalized);
  if (!profile) {
    return { status: 'not-found', email: normalized };
  }
  if (profile.uid === ownerUid) {
    return { status: 'self' };
  }

  await contactsRepo.addContact(ownerUid, profile.uid);
  return { status: 'added', contact: profile };
}
