import { fireEvent, render, screen } from '@testing-library/react-native';
import type { User } from '@react-native-firebase/auth';

import { ProfileSetupScreen } from './ProfileSetupScreen';
import { ThemeProvider } from '../../../shared/theme';
import { useProfileSetup } from '../hooks/useProfileSetup';

jest.mock('../hooks/useProfileSetup');

const mockUseProfileSetup = useProfileSetup as jest.MockedFunction<typeof useProfileSetup>;

const fakeUser = { uid: 'uid-1' } as User;

function mutationStub(overrides: Partial<ReturnType<typeof useProfileSetup>['uploadAvatar']> = {}) {
  return { mutate: jest.fn(), isPending: false, error: null, ...overrides } as any;
}

function renderScreen(onSkip = jest.fn()) {
  render(
    <ThemeProvider>
      <ProfileSetupScreen firebaseUser={fakeUser} refreshAuthState={jest.fn()} onSkip={onSkip} />
    </ThemeProvider>,
  );
  return { onSkip };
}

describe('ProfileSetupScreen', () => {
  it('triggers the avatar upload when "Choose photo" is pressed', () => {
    const uploadAvatar = mutationStub();
    mockUseProfileSetup.mockReturnValue({ uploadAvatar });

    renderScreen();

    fireEvent.press(screen.getByText('Choose photo'));

    expect(uploadAvatar.mutate).toHaveBeenCalled();
  });

  it('calls the navigator-owned onSkip when "Skip for now" is pressed', () => {
    mockUseProfileSetup.mockReturnValue({ uploadAvatar: mutationStub() });

    const { onSkip } = renderScreen();

    fireEvent.press(screen.getByText('Skip for now'));

    expect(onSkip).toHaveBeenCalled();
  });

  it('shows an error message when the upload fails', () => {
    mockUseProfileSetup.mockReturnValue({
      uploadAvatar: mutationStub({ error: new Error('Upload failed') }),
    });

    renderScreen();

    expect(screen.getByText('Upload failed')).toBeTruthy();
  });
});
