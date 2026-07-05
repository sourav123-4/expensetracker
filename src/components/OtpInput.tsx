import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export interface OtpInputHandle {
  /** Clears every box and refocuses the first one — call after a rejected code. */
  reset: () => void;
}

interface OtpInputProps {
  length?: number;
  onCodeChange: (code: string) => void;
}

/** A row of single-digit boxes for 6-digit SMS/email codes — paste-aware, auto-advancing. */
export const OtpInput = forwardRef<OtpInputHandle, OtpInputProps>(function OtpInputImpl(
  { length = 6, onCodeChange },
  ref,
) {
  const { theme } = useTheme();
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const inputs = useRef<Array<TextInput | null>>([]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      setDigits(Array(length).fill(''));
      onCodeChange('');
      inputs.current[0]?.focus();
    },
  }));

  const handleChange = (text: string, index: number) => {
    // Support pasting the full code into one box. `next` is computed from
    // the `digits` closure (safe here — this only runs from an event
    // handler, never mid-render) so onCodeChange can fire as a plain,
    // separate call instead of as a side effect inside setDigits' updater —
    // calling another component's setState from inside a state updater
    // function triggers React's "Cannot update a component while rendering
    // a different component" warning.
    if (text.length > 1) {
      const pasted = text.replace(/\D/g, '').slice(0, length).split('');
      const next = [...digits];
      pasted.forEach((d, i) => (next[i] = d));
      setDigits(next);
      onCodeChange(next.join(''));
      inputs.current[Math.min(pasted.length, length - 1)]?.focus();
      return;
    }
    const next = [...digits];
    next[index] = text.replace(/\D/g, '');
    setDigits(next);
    onCodeChange(next.join(''));
    if (text && index < length - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((digit, i) => (
        <TextInput
          key={i}
          ref={(el) => {
            inputs.current[i] = el;
          }}
          value={digit}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
          keyboardType="number-pad"
          maxLength={length}
          accessibilityLabel={`Digit ${i + 1} of ${length}`}
          style={[
            styles.box,
            {
              borderColor: digit ? theme.colors.brandPrimary : theme.colors.borderHairline,
              borderWidth: digit || theme.dark ? 1.5 : 0,
              color: theme.colors.textPrimary,
              backgroundColor: theme.colors.bgSurface,
              borderRadius: theme.radius.m,
            },
            // Boxes lift off the page with a soft shadow, matching the app's
            // card language; border color/width communicates the filled
            // state on top. The shadow must stay on regardless of content —
            // toggling Android's `elevation` on the exact frame a digit is
            // typed promotes/demotes the EditText to its own hardware layer,
            // which can silently drop keyboard focus (the box looks fine but
            // stops accepting input).
            !theme.dark &&
              Platform.select({
                ios: {
                  shadowColor: '#3730A3',
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 3 },
                },
                android: { elevation: 2 },
              }),
          ]}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  box: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
  },
});
