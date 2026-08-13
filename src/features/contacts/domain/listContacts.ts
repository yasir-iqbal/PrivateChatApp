import {
  firestoreUserProfileRepository,
  type UserProfileRepository,
} from '../../profile/data/userProfileRepository';
import { firestoreContactsRepository, type ContactsRepository } from '../data/contactsRepository';
import { contactDisplayName, type Contact } from './contact';

export async function listContacts(
  ownerUid: string,
  contactsRepo: ContactsRepository = firestoreContactsRepository,
  profileRepo: UserProfileRepository = firestoreUserProfileRepository,
): Promise<Contact[]> {
  const edges = await contactsRepo.listContactEdges(ownerUid);
  if (edges.length === 0) return [];

  const profiles = await profileRepo.getProfiles(edges.map((edge) => edge.uid));
  const profilesByUid = new Map(profiles.map((profile) => [profile.uid, profile]));

  return edges
    .map((edge) => {
      const profile = profilesByUid.get(edge.uid);
      // An edge with no profile means the account was deleted. Skip it rather
      // than rendering a blank row.
      return profile ? { ...profile, addedAt: edge.addedAt } : null;
    })
    .filter((contact): contact is Contact => contact !== null)
    .sort((a, b) => contactDisplayName(a).localeCompare(contactDisplayName(b)));
}
