import { fireEvent, render, screen } from '@testing-library/react-native';

import { Button } from './Button';
import { ThemeProvider } from '../theme';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('Button', () => {
  it('renders the label and calls onPress when tapped', () => {
    const onPress = jest.fn();
    renderWithTheme(<Button label="Sign up" onPress={onPress} />);

    fireEvent.press(screen.getByText('Sign up'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows a spinner instead of the label while loading', () => {
    renderWithTheme(<Button label="Sign up" onPress={jest.fn()} loading />);

    expect(screen.queryByText('Sign up')).toBeNull();
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    renderWithTheme(<Button label="Sign up" onPress={onPress} disabled />);

    fireEvent.press(screen.getByText('Sign up'));

    expect(onPress).not.toHaveBeenCalled();
  });
});
