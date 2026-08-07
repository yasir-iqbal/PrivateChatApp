import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import { SignUpScreen } from './SignUpScreen';
import { signUp } from '../domain/signUp';
import { ThemeProvider } from '../../../shared/theme';
import { createQueryClientWrapper } from '../../../shared/testing/createQueryClientWrapper';
import type { AuthUser } from '../domain/authUser';

jest.mock('../domain/signUp');

const mockSignUp = signUp as jest.MockedFunction<typeof signUp>;

describe('SignUpScreen', () => {
  const QueryWrapper = createQueryClientWrapper();

  function renderScreen(navigate = jest.fn()) {
    render(
      <QueryWrapper>
        <ThemeProvider>
          <SignUpScreen navigation={{ navigate } as any} route={{} as any} />
        </ThemeProvider>
      </QueryWrapper>,
    );
    return { navigate };
  }

  it('shows validation errors and does not submit when fields are empty', async () => {
    renderScreen();

    fireEvent.press(screen.getByText('Sign up'));

    await waitFor(() => expect(screen.getByText('Enter a valid email')).toBeTruthy());
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('submits valid input to the signUp domain function', async () => {
    const fakeUser: AuthUser = { uid: 'uid-1', email: 'a@b.com', displayName: 'Alice', photoURL: null, emailVerified: false };
    mockSignUp.mockResolvedValue(fakeUser);
    renderScreen();

    fireEvent.changeText(screen.getByTestId('signup-name-input'), 'Alice');
    fireEvent.changeText(screen.getByTestId('signup-email-input'), 'a@b.com');
    fireEvent.changeText(screen.getByTestId('signup-password-input'), 'password1');
    fireEvent.changeText(screen.getByTestId('signup-confirm-password-input'), 'password1');
    fireEvent.press(screen.getByText('Sign up'));

    await waitFor(() =>
      expect(mockSignUp).toHaveBeenCalledWith({
        displayName: 'Alice',
        email: 'a@b.com',
        password: 'password1',
        confirmPassword: 'password1',
      }),
    );
  });

  it('navigates to Login when the link is pressed', () => {
    const { navigate } = renderScreen();

    fireEvent.press(screen.getByText('Already have an account? Log in'));

    expect(navigate).toHaveBeenCalledWith('Login');
  });
});
