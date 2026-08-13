import { removeContact } from './removeContact';
import type { ContactsRepository } from '../data/contactsRepository';

describe('removeContact', () => {
  it('removes the contact from the owner list', async () => {
    const contactsRepo: jest.Mocked<ContactsRepository> = {
      listContactEdges: jest.fn(),
      addContact: jest.fn(),
      removeContact: jest.fn().mockResolvedValue(undefined),
    };

    await removeContact('uid-me', 'uid-bob', contactsRepo);

    expect(contactsRepo.removeContact).toHaveBeenCalledWith('uid-me', 'uid-bob');
  });
});
