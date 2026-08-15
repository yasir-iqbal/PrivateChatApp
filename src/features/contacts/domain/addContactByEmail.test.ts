import { addContactByEmail } from './addContactByEmail';
import type { UserProfile, UserProfileRepository } from '../../profile/data/userProfileRepository';
import type { ContactsRepository } from '../data/contactsRepository';

const bob: UserProfile = { uid: 'uid-bob', email: 'bob@b.com', displayName: 'Bob', photoURL: null };

function fakeProfileRepo(found: UserProfile | null): jest.Mocked<UserProfileRepository> {
  return {
    upsertProfile: jest.fn(),
    findByEmail: jest.fn().mockResolvedValue(found),
    getProfiles: jest.fn(),
    touchLastActive: jest.fn(),
    observeLastActive: jest.fn(),
  };
}

function fakeContactsRepo(): jest.Mocked<ContactsRepository> {
  return {
    listContactEdges: jest.fn(),
    addContact: jest.fn().mockResolvedValue(undefined),
    removeContact: jest.fn(),
  };
}

describe('addContactByEmail', () => {
  it('adds the contact when the email is registered', async () => {
    const profileRepo = fakeProfileRepo(bob);
    const contactsRepo = fakeContactsRepo();

    const result = await addContactByEmail('uid-me', 'me@b.com', 'bob@b.com', profileRepo, contactsRepo);

    expect(result).toEqual({ status: 'added', contact: bob });
    expect(contactsRepo.addContact).toHaveBeenCalledWith('uid-me', 'uid-bob');
  });

  // Firestore's == is case-sensitive, so the lookup has to be normalized or
  // "Bob@B.com" would report not-found for an account that plainly exists.
  it('normalizes case and surrounding whitespace before looking up', async () => {
    const profileRepo = fakeProfileRepo(bob);

    await addContactByEmail('uid-me', 'me@b.com', '  BOB@B.com ', profileRepo, fakeContactsRepo());

    expect(profileRepo.findByEmail).toHaveBeenCalledWith('bob@b.com');
  });

  it('reports not-found without writing anything when nobody has that email', async () => {
    const profileRepo = fakeProfileRepo(null);
    const contactsRepo = fakeContactsRepo();

    const result = await addContactByEmail('uid-me', 'me@b.com', 'ghost@b.com', profileRepo, contactsRepo);

    expect(result).toEqual({ status: 'not-found', email: 'ghost@b.com' });
    expect(contactsRepo.addContact).not.toHaveBeenCalled();
  });

  it('refuses to add the signed-in user by their own email', async () => {
    const profileRepo = fakeProfileRepo(bob);
    const contactsRepo = fakeContactsRepo();

    const result = await addContactByEmail('uid-me', 'Me@B.com', 'me@b.com', profileRepo, contactsRepo);

    expect(result).toEqual({ status: 'self' });
    expect(profileRepo.findByEmail).not.toHaveBeenCalled();
    expect(contactsRepo.addContact).not.toHaveBeenCalled();
  });

  // Covers a second address on the same account, where the email comparison
  // above can't catch it but the resolved uid can.
  it('refuses when the looked-up profile turns out to be the signed-in user', async () => {
    const profileRepo = fakeProfileRepo({ ...bob, uid: 'uid-me' });
    const contactsRepo = fakeContactsRepo();

    const result = await addContactByEmail('uid-me', 'me@b.com', 'alias@b.com', profileRepo, contactsRepo);

    expect(result).toEqual({ status: 'self' });
    expect(contactsRepo.addContact).not.toHaveBeenCalled();
  });
});
