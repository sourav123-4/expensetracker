import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { appLock } from '../services/appLock';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { BrandMark } from './BrandMark';

const PIN_LENGTH = 4;
const PAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];

interface LockScreenProps {
  onUnlock: () => void;
}

/** Full-screen PIN pad with optional biometric unlock, shown over the app. */
export function LockScreen({ onUnlock }: LockScreenProps) {
  const { theme } = useTheme();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState<string | null>(null);

  const tryBiometric = useCallback(async () => {
    if (await appLock.promptBiometric()) onUnlock();
  }, [onUnlock]);

  useEffect(() => {
    if (!appLock.isBiometricEnabled()) return;
    appLock.biometricAvailability().then(({ available, label }) => {
      if (available) {
        setBiometricLabel(label);
        tryBiometric(); // auto-prompt on mount
      }
    });
  }, [tryBiometric]);

  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return;
    if (appLock.verifyPin(pin)) {
      onUnlock();
    } else {
      setError(true);
      setPin('');
    }
  }, [pin, onUnlock]);

  const press = (key: string) => {
    setError(false);
    if (key === '⌫') setPin((p) => p.slice(0, -1));
    else if (key && pin.length < PIN_LENGTH) setPin((p) => p + key);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bgPage }]}>
      <BrandMark size={64} />
      <AppText variant="h2" style={styles.title}>
        Enter your PIN
      </AppText>

      <View style={styles.dots}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i < pin.length
                    ? error
                      ? theme.colors.statusCritical
                      : theme.colors.brandPrimary
                    : theme.colors.borderHairline,
              },
            ]}
          />
        ))}
      </View>
      {error ? (
        <AppText variant="caption" tone="critical" accessibilityLiveRegion="polite">
          Wrong PIN — try again
        </AppText>
      ) : (
        <AppText variant="caption" tone="muted"> </AppText>
      )}

      <View style={styles.pad}>
        {PAD.map((key, i) => (
          <Pressable
            key={i}
            onPress={() => press(key)}
            disabled={!key}
            accessibilityRole="button"
            accessibilityLabel={key === '⌫' ? 'Delete' : key}
            style={({ pressed }) => [
              styles.key,
              key !== '' && { backgroundColor: theme.colors.bgSurface },
              pressed && key !== '' && { backgroundColor: theme.colors.brandSubtle },
            ]}
          >
            <AppText variant="h2">{key}</AppText>
          </Pressable>
        ))}
      </View>

      {biometricLabel ? (
        <Pressable onPress={tryBiometric} accessibilityRole="button" style={styles.biometric}>
          <AppText tone="brand" variant="bodyStrong">
            Use {biometricLabel}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    gap: 14,
  },
  title: { marginTop: 8 },
  dots: { flexDirection: 'row', gap: 14, marginTop: 6 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  pad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 264,
    gap: 12,
    justifyContent: 'center',
    marginTop: 10,
  },
  key: {
    width: 80,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometric: { marginTop: 10, padding: 8 },
});
