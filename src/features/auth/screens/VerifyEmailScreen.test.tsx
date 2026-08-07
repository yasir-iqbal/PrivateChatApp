import { fireEvent, render, screen } from '@testing-library/react-native';
import type { User } from '@react-native-firebase/auth';

import { VerifyEmailScreen } from './VerifyEmailScreen';
import { ThemeProvider } from '../../../shared/theme';
import { useVerifyEmail } from '../hooks/useVerifyEmail';
import type { AuthUser } from '../domain/authUser';

jest.mock('../hooks/useVerifyEmail');

const mockUseVerifyEmail = useVerifyEmail as jest.MockedFunction<typeof useVerifyEmail>;

const fakeFirebaseUser = { uid: 'uid-1' } as User;
const fakeAuthUser: AuthUser = { uid: 'uid-1', email: 'a@b.com', displayName: null, photoURL: null, emailVerified: false };

function mutationStub(overrides: Partial<ReturnType<typeof useVerifyEmail>['resend']> = {}) {
  return { mutate: jest.fn(), isPending: false, isSuccess: false, error: null, ...overrides } as any;
}

describe('VerifyEmailScreen', () => {
  it("shows the user's email and calls resend/refresh/signOut when pressed", () => {
    const resend = mutationStub();
    const refresh = mutationStub();
    const signOut = mutationStub();
    mockUseVerifyEmail.mockReturnValue({ resend, refresh, signOut } as any);

    render(
      <ThemeProvider>
        <VerifyEmailScreen firebaseUser={fakeFirebaseUser} authUser={fakeAuthUser} />
      </ThemeProvider>,
    );

    expect(screen.getByText('a@b.com')).toBeTruthy();

    fireEvent.press(screen.getByText("I've verified — Continue"));
    expect(refresh.mutate).toHaveBeenCalled();

    fireEvent.press(screen.getByText('Resend email'));
    expect(resend.mutate).toHaveBeenCalled();

    fireEvent.press(screen.getByText('Log out'));
    expect(signOut.mutate).toHaveBeenCalled();
  });

  it('shows a success message after resending', () => {
    mockUseVerifyEmail.mockReturnValue({
      resend: mutationStub({ isSuccess: true }),
      refresh: mutationStub(),
      signOut: mutationStub(),
    } as any);

    render(
      <ThemeProvider>
        <VerifyEmailScreen firebaseUser={fakeFirebaseUser} authUser={fakeAuthUser} />
      </ThemeProvider>,
    );

    expect(screen.getByText('Verification email sent.')).toBeTruthy();
  });
});
