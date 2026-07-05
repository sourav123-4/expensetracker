import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { ThemeProvider } from '../theme/ThemeProvider';
import { Button } from './Button';

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('Button', () => {
  it('renders its title and responds to press', () => {
    const onPress = jest.fn();
    const { getByRole } = renderWithTheme(<Button title="Log in" onPress={onPress} />);

    fireEvent.press(getByRole('button', { name: 'Log in' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire onPress while loading', () => {
    const onPress = jest.fn();
    const { getByRole } = renderWithTheme(<Button title="Log in" onPress={onPress} loading />);

    fireEvent.press(getByRole('button', { name: 'Log in' }));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not fire onPress while disabled', () => {
    const onPress = jest.fn();
    const { getByRole } = renderWithTheme(<Button title="Log in" onPress={onPress} disabled />);

    fireEvent.press(getByRole('button', { name: 'Log in' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});
