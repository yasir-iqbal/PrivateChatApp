import { listContacts } from './listContacts';
import type { UserProfile, UserProfileRepository } from '../../profile/data/userProfileRepository';
import type { ContactEdge, ContactsRepository } from '../data/contactsRepository';

const bob: UserProfile = { uid: 'uid-bob', email: 'bob@b.com', displayName: 'Bob', photoURL: null };
const ada: UserProfile = { uid: 'uid-ada', email: 'ada@b.com', displayName: 'Ada', photoURL: null };

function fakeContactsRepo(edges: ContactEdge[]): jest.Mocked<ContactsRepository> {
  return {
    listContactEdges: jest.fn().mockResolvedValue(edges),
    addContact: jest.fn(),
    removeContact: jest.fn(),
  };
}

function fakeProfileRepo(profiles: UserProfile[]): jest.Mocked<UserProfileRepository> {
  return {
    upsertProfile: jest.fn(),
    findByEmail: jest.fn(),
    getProfiles: jest.fn().mockResolvedValue(profiles),
    touchLastActive: jest.fn(),
    observeLastActive: jest.fn(),
  };
}

describe('listContacts', () => {
  it('joins each edge with its live profile and sorts by display name', async () => {
    const contactsRepo = fakeContactsRepo([
      { uid: 'uid-bob', addedAt: 1 },
      { uid: 'uid-ada', addedAt: 2 },
    ]);

    const result = await listContacts('uid-me', contactsRepo, fakeProfileRepo([bob, ada]));

    expect(result).toEqual([
      { ...ada, addedAt: 2 },
      { ...bob, addedAt: 1 },
    ]);
  });

  it('skips the profile lookup entirely when there are no contacts', async () => {
    const profileRepo = fakeProfileRepo([]);

    const result = await listContacts('uid-me', fakeContactsRepo([]), profileRepo);

    expect(result).toEqual([]);
    expect(profileRepo.getProfiles).not.toHaveBeenCalled();
  });

  // A deleted account leaves the edge behind; rendering it would show a blank row.
  it('drops edges whose profile no longer exists', async () => {
    const contactsRepo = fakeContactsRepo([
      { uid: 'uid-bob', addedAt: 1 },
      { uid: 'uid-deleted', addedAt: 2 },
    ]);

    const result = await listContacts('uid-me', contactsRepo, fakeProfileRepo([bob]));

    expect(result).toEqual([{ ...bob, addedAt: 1 }]);
  });

  it('sorts by email for contacts with no display name', async () => {
    const noName: UserProfile = { uid: 'uid-x', email: 'aaa@b.com', displayName: null, photoURL: null };
    const contactsRepo = fakeContactsRepo([
      { uid: 'uid-bob', addedAt: 1 },
      { uid: 'uid-x', addedAt: 2 },
    ]);

    const result = await listContacts('uid-me', contactsRepo, fakeProfileRepo([bob, noName]));

    expect(result.map((contact) => contact.uid)).toEqual(['uid-x', 'uid-bob']);
  });
});
