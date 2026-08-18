import { fireEvent, render, screen } from '@testing-library/react-native';

import { ContactDetailScreen } from './ContactDetailScreen';
import { ThemeProvider } from '../../../shared/theme';
import type { AuthUser } from '../../auth/domain/authUser';
import type { SharedMedia } from '../../chat/domain/listSharedMedia';
import { useSharedMedia } from '../../chat/hooks/useSharedMedia';
import { useContactPresence } from '../../presence/hooks/useContactPresence';
import { useBlockStatus } from '../hooks/useBlockStatus';

jest.mock('../../chat/hooks/useSharedMedia');
jest.mock('../../presence/hooks/useContactPresence');
jest.mock('../hooks/useBlockStatus');

const mockUseSharedMedia = useSharedMedia as jest.MockedFunction<typeof useSharedMedia>;
const mockUseContactPresence = useContactPresence as jest.MockedFunction<typeof useContactPresence>;
const mockUseBlockStatus = useBlockStatus as jest.MockedFunction<typeof useBlockStatus>;

const authUser: AuthUser = {
  uid: 'uid-me',
  email: 'me@b.com',
  displayName: 'Me',
  photoURL: null,
  emailVerified: true,
};

const media: SharedMedia[] = [
  { id: 'p1', type: 'image', mediaUrl: 'https://cdn/p.jpg', clientSentAt: 2 },
  { id: 'v1', type: 'video', mediaUrl: 'https://cdn/v.mp4', clientSentAt: 1 },
];

function renderScreen(
  overrides: { media?: SharedMedia[]; pending?: boolean; blocked?: boolean } = {},
) {
  const toggle = jest.fn();
  const navigation = { goBack: jest.fn(), navigate: jest.fn() };
  mockUseSharedMedia.mockReturnValue({
    data: overrides.media ?? media,
    isPending: overrides.pending ?? false,
  } as never);
  mockUseContactPresence.mockReturnValue({ status: 'online' });
  mockUseBlockStatus.mockReturnValue({
    blocked: overrides.blocked ?? false,
    toggle,
    isPending: false,
    error: null,
  });

  render(
    <ThemeProvider>
      <ContactDetailScreen
        {...({
          navigation,
          route: {
            params: {
              contactUid: 'uid-bob',
              contactName: 'Bob',
              contactEmail: 'bob@b.com',
              contactPhotoURL: null,
            },
          },
        } as any)}
        authUser={authUser}
      />
    </ThemeProvider>,
  );
  return { toggle, navigation };
}

describe('ContactDetailScreen', () => {
  it('shows the contact identity', () => {
    renderScreen();

    expect(screen.getByText('Bob')).toBeTruthy();
    expect(screen.getByText('bob@b.com')).toBeTruthy();
  });

  it('shows presence when not blocked', () => {
    renderScreen();

    expect(screen.getByText('online')).toBeTruthy();
  });

  it('hides presence for a blocked contact', () => {
    renderScreen({ blocked: true });

    expect(screen.queryByText('online')).toBeNull();
  });

  it('shows the shared media with a count', () => {
    renderScreen();

    expect(screen.getByText('Shared media')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
    expect(screen.getByLabelText('Shared photo')).toBeTruthy();
    expect(screen.getByLabelText('Shared video')).toBeTruthy();
  });

  it('says so when nothing has been shared', () => {
    renderScreen({ media: [] });

    expect(screen.getByText('No photos or videos yet.')).toBeTruthy();
  });

  it('offers blocking, and unblocking once blocked', () => {
    const { toggle } = renderScreen();
    fireEvent.press(screen.getByLabelText('Block contact'));
    expect(toggle).toHaveBeenCalledWith('Bob');

    const unblocked = renderScreen({ blocked: true });
    expect(screen.getByText('Unblock Bob')).toBeTruthy();
    expect(unblocked.toggle).not.toHaveBeenCalled();
  });
});
