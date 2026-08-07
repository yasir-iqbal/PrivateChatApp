import { toAuthUser } from './authUser';
import type { User } from '@react-native-firebase/auth';

describe('toAuthUser', () => {
  it('maps the fields used by the app', () => {
    const fakeUser = {
      uid: 'uid-1',
      email: 'a@b.com',
      displayName: 'A B',
      photoURL: null,
      emailVerified: true,
    } as User;

    expect(toAuthUser(fakeUser)).toEqual({
      uid: 'uid-1',
      email: 'a@b.com',
      displayName: 'A B',
      photoURL: null,
      emailVerified: true,
    });
  });
});
