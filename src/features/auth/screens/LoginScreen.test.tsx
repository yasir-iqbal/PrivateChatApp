import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { LoginScreen } from './LoginScreen';
import { signIn } from '../domain/signIn';
import { ThemeProvider } from '../../../shared/theme';
import { createQueryClientWrapper } from '../../../shared/testing/createQueryClientWrapper';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';
import type { AuthUser } from '../domain/authUser';

jest.mock('../domain/signIn');
jest.mock('../hooks/useGoogleSignIn');

const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
const mockUseGoogleSignIn = useGoogleSignIn as jest.MockedFunction<typeof useGoogleSignIn>;

describe('LoginScreen', () => {
  const QueryWrapper = createQueryClientWrapper();

  function renderScreen(navigate = jest.fn()) {
    render(
      <QueryWrapper>
        <ThemeProvider>
          <LoginScreen navigation={{ navigate } as any} route={{} as any} />
        </ThemeProvider>
      </QueryWrapper>,
    );
    return { navigate };
  }

  beforeEach(() => {
    mockUseGoogleSignIn.mockReturnValue({ mutate: jest.fn(), isPending: false, error: null } as any);
  });

  it('shows a validation error and does not submit when fields are empty', async () => {
    renderScreen();

    fireEvent.press(screen.getByText('Log in'));

    await waitFor(() => expect(screen.getByText('Enter a valid email')).toBeTruthy());
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('submits valid input to the signIn domain function', async () => {
    const fakeUser: AuthUser = { uid: 'uid-1', email: 'a@b.com', displayName: null, photoURL: null, emailVerified: true };
    mockSignIn.mockResolvedValue(fakeUser);
    renderScreen();

    fireEvent.changeText(screen.getByTestId('login-email-input'), 'a@b.com');
    fireEvent.changeText(screen.getByTestId('login-password-input'), 'password1');
    fireEvent.press(screen.getByText('Log in'));

    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith({ email: 'a@b.com', password: 'password1' }));
  });

  it('navigates to SignUp when the link is pressed', () => {
    const { navigate } = renderScreen();

    fireEvent.press(screen.getByText("Don't have an account? Sign up"));

    expect(navigate).toHaveBeenCalledWith('SignUp');
  });

  it('triggers Google sign-in when pressed', () => {
    const mutate = jest.fn();
    mockUseGoogleSignIn.mockReturnValue({ mutate, isPending: false, error: null } as any);
    renderScreen();

    fireEvent.press(screen.getByText('Continue with Google'));

    expect(mutate).toHaveBeenCalled();
  });
});
