import { contactDisplayName } from './contact';

describe('contactDisplayName', () => {
  it('prefers the display name', () => {
    expect(contactDisplayName({ displayName: 'Ada', email: 'a@b.com' })).toBe('Ada');
  });

  it('falls back to the email when there is no display name', () => {
    expect(contactDisplayName({ displayName: null, email: 'a@b.com' })).toBe('a@b.com');
  });

  it('treats a whitespace-only display name as missing', () => {
    expect(contactDisplayName({ displayName: '   ', email: 'a@b.com' })).toBe('a@b.com');
  });
});
