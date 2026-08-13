import { firestoreContactsRepository, type ContactsRepository } from '../data/contactsRepository';

export async function removeContact(
  ownerUid: string,
  contactUid: string,
  contactsRepo: ContactsRepository = firestoreContactsRepository,
): Promise<void> {
  await contactsRepo.removeContact(ownerUid, contactUid);
}
