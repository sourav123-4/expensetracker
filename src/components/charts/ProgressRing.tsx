import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from '../AppText';

interface ProgressRingProps {
  /** 0..1 */
  progress: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

/** Sequential-palette progress ring — budget/EMI/savings-goal completion. */
export function ProgressRing({ progress, size = 72, strokeWidth = 8, label }: ProgressRingProps) {
  const { theme } = useTheme();
  const clamped = Math.min(1, Math.max(0, progress));
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const trackColor = theme.dark ? 'rgba(255,255,255,0.10)' : 'rgba(11,11,15,0.08)';
  // Sequential ramp: pick the step matching the current fill for a subtle
  // "fuller = deeper" cue rather than a flat single color.
  const seq = theme.colors.chartSequential;
  const fillColor = seq[Math.min(seq.length - 1, Math.round(clamped * (seq.length - 1)))];

  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={fillColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - clamped)}
          fill="none"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <AppText variant="bodyStrong" tabular>
          {Math.round(clamped * 100)}%
        </AppText>
        {label ? (
          <AppText variant="caption" tone="muted">
            {label}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}
