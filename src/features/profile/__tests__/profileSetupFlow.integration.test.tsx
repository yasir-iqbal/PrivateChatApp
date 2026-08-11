import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { User } from '@react-native-firebase/auth';

import { RootNavigator } from '../../../navigation/RootNavigator';
import { createQueryClientWrapper } from '../../../shared/testing/createQueryClientWrapper';
import { ThemeProvider } from '../../../shared/theme';
import { observeAuthState } from '../../auth/domain/observeAuthState';
import { refreshAuthUser } from '../../auth/domain/refreshAuthUser';
import { getHasSkippedProfileSetup } from '../domain/getHasSkippedProfileSetup';
import { pickAndUploadAvatar } from '../domain/pickAndUploadAvatar';
import { skipProfileSetup } from '../domain/skipProfileSetup';

jest.mock('../../auth/domain/observeAuthState');
jest.mock('../../auth/domain/refreshAuthUser');
jest.mock('../domain/getHasSkippedProfileSetup');
jest.mock('../domain/pickAndUploadAvatar');
jest.mock('../domain/skipProfileSetup');

const mockObserveAuthState = observeAuthState as jest.MockedFunction<typeof observeAuthState>;
const mockRefreshAuthUser = refreshAuthUser as jest.MockedFunction<typeof refreshAuthUser>;
const mockGetHasSkipped = getHasSkippedProfileSetup as jest.MockedFunction<typeof getHasSkippedProfileSetup>;
const mockPickAndUploadAvatar = pickAndUploadAvatar as jest.MockedFunction<typeof pickAndUploadAvatar>;
const mockSkipProfileSetup = skipProfileSetup as jest.MockedFunction<typeof skipProfileSetup>;

// Verified, but no avatar yet — the state that lands on ProfileSetup.
const verifiedUser = {
  uid: 'uid-1',
  email: 'a@b.com',
  displayName: null,
  photoURL: null,
  emailVerified: true,
} as User;

const SIGNED_IN_TEXT = 'Signed in — Dashboard coming soon';

describe('profile setup flow', () => {
  const QueryWrapper = createQueryClientWrapper();

  async function renderFlow() {
    mockObserveAuthState.mockImplementation((callback) => {
      callback(verifiedUser);
      return jest.fn();
    });

    render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <QueryWrapper>
          <ThemeProvider>
            <RootNavigator />
          </ThemeProvider>
        </QueryWrapper>
      </SafeAreaProvider>,
    );

    await waitFor(() => expect(screen.getByText('Add a profile photo')).toBeTruthy());
  }

  it('leaves the profile setup screen once "Skip for now" is pressed', async () => {
    mockGetHasSkipped.mockResolvedValue(false);
    mockSkipProfileSetup.mockResolvedValue(undefined);

    await renderFlow();

    fireEvent.press(screen.getByText('Skip for now'));

    expect(mockSkipProfileSetup).toHaveBeenCalledWith('uid-1');
    await waitFor(() => expect(screen.getByText(SIGNED_IN_TEXT)).toBeTruthy());
  });

  it('leaves the profile setup screen once an avatar upload completes', async () => {
    mockGetHasSkipped.mockResolvedValue(false);
    mockPickAndUploadAvatar.mockResolvedValue(true);
    // refreshAuthUser must surface the *new* photoURL, otherwise the navigator
    // keeps rendering ProfileSetup after a successful upload.
    mockRefreshAuthUser.mockResolvedValue({
      uid: 'uid-1',
      email: 'a@b.com',
      displayName: null,
      photoURL: 'https://cdn/avatar.jpg',
      emailVerified: true,
    });

    await renderFlow();

    fireEvent.press(screen.getByText('Choose photo'));

    await waitFor(() => expect(screen.getByText(SIGNED_IN_TEXT)).toBeTruthy());
  });

  it('stays on the profile setup screen when the picker is cancelled', async () => {
    mockGetHasSkipped.mockResolvedValue(false);
    mockPickAndUploadAvatar.mockResolvedValue(false);

    await renderFlow();

    fireEvent.press(screen.getByText('Choose photo'));

    await waitFor(() => expect(mockPickAndUploadAvatar).toHaveBeenCalled());
    expect(mockRefreshAuthUser).not.toHaveBeenCalled();
    expect(screen.getByText('Add a profile photo')).toBeTruthy();
  });
});
