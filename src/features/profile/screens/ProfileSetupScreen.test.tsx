import { fireEvent, render, screen } from '@testing-library/react-native';
import type { User } from '@react-native-firebase/auth';

import { ProfileSetupScreen } from './ProfileSetupScreen';
import { ThemeProvider } from '../../../shared/theme';
import { useProfileSetup } from '../hooks/useProfileSetup';
import { useProfileSetupStatus } from '../hooks/useProfileSetupStatus';

jest.mock('../hooks/useProfileSetup');
jest.mock('../hooks/useProfileSetupStatus');

const mockUseProfileSetup = useProfileSetup as jest.MockedFunction<typeof useProfileSetup>;
const mockUseProfileSetupStatus = useProfileSetupStatus as jest.MockedFunction<typeof useProfileSetupStatus>;

const fakeUser = { uid: 'uid-1' } as User;

function mutationStub(overrides: Partial<ReturnType<typeof useProfileSetup>['uploadAvatar']> = {}) {
  return { mutate: jest.fn(), isPending: false, error: null, ...overrides } as any;
}

describe('ProfileSetupScreen', () => {
  it('triggers the avatar upload when "Choose photo" is pressed', () => {
    const uploadAvatar = mutationStub();
    mockUseProfileSetup.mockReturnValue({ uploadAvatar });
    mockUseProfileSetupStatus.mockReturnValue({ hasSkipped: false, loading: false, markSkipped: jest.fn() });

    render(
      <ThemeProvider>
        <ProfileSetupScreen firebaseUser={fakeUser} refreshAuthState={jest.fn()} />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByText('Choose photo'));

    expect(uploadAvatar.mutate).toHaveBeenCalled();
  });

  it('calls markSkipped when "Skip for now" is pressed', () => {
    const markSkipped = jest.fn();
    mockUseProfileSetup.mockReturnValue({ uploadAvatar: mutationStub() });
    mockUseProfileSetupStatus.mockReturnValue({ hasSkipped: false, loading: false, markSkipped });

    render(
      <ThemeProvider>
        <ProfileSetupScreen firebaseUser={fakeUser} refreshAuthState={jest.fn()} />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByText('Skip for now'));

    expect(markSkipped).toHaveBeenCalled();
  });

  it('shows an error message when the upload fails', () => {
    mockUseProfileSetup.mockReturnValue({
      uploadAvatar: mutationStub({ error: new Error('Upload failed') }),
    });
    mockUseProfileSetupStatus.mockReturnValue({ hasSkipped: false, loading: false, markSkipped: jest.fn() });

    render(
      <ThemeProvider>
        <ProfileSetupScreen firebaseUser={fakeUser} refreshAuthState={jest.fn()} />
      </ThemeProvider>,
    );

    expect(screen.getByText('Upload failed')).toBeTruthy();
  });
});
