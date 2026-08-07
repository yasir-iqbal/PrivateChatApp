import { fireEvent, render, screen } from '@testing-library/react-native';

import { TextField } from './TextField';
import { ThemeProvider } from '../theme';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('TextField', () => {
  it('renders the label and forwards text input', () => {
    const onChangeText = jest.fn();
    renderWithTheme(<TextField label="Email" value="" onChangeText={onChangeText} />);

    expect(screen.getByText('Email')).toBeTruthy();
    fireEvent.changeText(screen.getByDisplayValue(''), 'a@b.com');

    expect(onChangeText).toHaveBeenCalledWith('a@b.com');
  });

  it('shows the error message when provided', () => {
    renderWithTheme(<TextField label="Email" value="" onChangeText={jest.fn()} error="Enter a valid email" />);

    expect(screen.getByText('Enter a valid email')).toBeTruthy();
  });

  it('masks input by default when isPassword and reveals it on toggle', () => {
    renderWithTheme(<TextField label="Password" value="secret" onChangeText={jest.fn()} isPassword />);

    const input = screen.getByDisplayValue('secret');
    expect(input.props.secureTextEntry).toBe(true);

    fireEvent.press(screen.getByTestId('text-field-password-toggle'));

    expect(screen.getByDisplayValue('secret').props.secureTextEntry).toBe(false);
  });
});
