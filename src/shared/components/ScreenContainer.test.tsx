import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ScreenContainer } from './ScreenContainer';
import { ThemeProvider } from '../theme';

describe('ScreenContainer', () => {
  it('renders its children', () => {
    render(
      <ThemeProvider>
        <ScreenContainer>
          <Text>Hello</Text>
        </ScreenContainer>
      </ThemeProvider>,
    );

    expect(screen.getByText('Hello')).toBeTruthy();
  });
});
