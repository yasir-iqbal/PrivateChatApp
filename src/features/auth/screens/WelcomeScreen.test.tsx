import { fireEvent, render, screen } from '@testing-library/react-native';

import { WelcomeScreen } from './WelcomeScreen';
import { ThemeProvider } from '../../../shared/theme';
import { useGoogleSignIn } from '../hooks/useGoogleSignIn';

jest.mock('../hooks/useGoogleSignIn');

const mockUseGoogleSignIn = useGoogleSignIn as jest.MockedFunction<typeof useGoogleSignIn>;

function renderScreen(navigate: jest.Mock) {
  return render(
    <ThemeProvider>
      <WelcomeScreen navigation={{ navigate } as any} route={{} as any} />
    </ThemeProvider>,
  );
}

describe('WelcomeScreen', () => {
  beforeEach(() => {
    mockUseGoogleSignIn.mockReturnValue({ mutate: jest.fn(), isPending: false, error: null } as any);
  });

  it('navigates to SignUp when "Sign up with email" is pressed', () => {
    const navigate = jest.fn();
    renderScreen(navigate);

    fireEvent.press(screen.getByText('Sign up with email'));

    expect(navigate).toHaveBeenCalledWith('SignUp');
  });

  it('navigates to Login when "I already have an account" is pressed', () => {
    const navigate = jest.fn();
    renderScreen(navigate);

    fireEvent.press(screen.getByText('I already have an account'));

    expect(navigate).toHaveBeenCalledWith('Login');
  });

  it('triggers Google sign-in when "Continue with Google" is pressed', () => {
    const mutate = jest.fn();
    mockUseGoogleSignIn.mockReturnValue({ mutate, isPending: false, error: null } as any);
    renderScreen(jest.fn());

    fireEvent.press(screen.getByText('Continue with Google'));

    expect(mutate).toHaveBeenCalled();
  });
});
