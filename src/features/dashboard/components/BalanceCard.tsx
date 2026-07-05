import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { AppText } from '../../../components/AppText';
import { ArrowDownLeftIcon, ArrowUpRightIcon } from '../../../components/icons';
import { useTheme } from '../../../theme/ThemeProvider';
import { formatCurrency } from '../../../utils/format';

interface BalanceCardProps {
  balance: number;
  income: number;
  expense: number;
}

const WHITE = '#FFFFFF';

/**
 * Dashboard hero: diagonal brand gradient with soft decorative circles.
 * Text is always white — the gradient stops are chosen to keep ≥4.5:1
 * contrast in both themes, independent of the theme's brandOnPrimary.
 */
export function BalanceCard({ balance, income, expense }: BalanceCardProps) {
  const { theme } = useTheme();
  const stops = theme.dark ? ['#4338CA', '#7C3AED'] : ['#4F46E5', '#7C3AED'];

  return (
    // Shadow lives on this outer wrapper — the inner view clips the SVG
    // gradient to its rounded corners, which would clip the shadow too.
    // Android elevation only casts from a view with a background, so the
    // wrapper carries the gradient's start color + matching radius too.
    <View
      style={
        !theme.dark && [
          { borderRadius: theme.radius.l + 4, backgroundColor: stops[0] },
          Platform.select({
            ios: {
              shadowColor: '#4F46E5',
              shadowOpacity: 0.28,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 10 },
            },
            // Untinted — tinted elevation reads as a harsh rim on OEM skins
            android: { elevation: 4 },
          }),
        ]
      }
    >
      <View style={[styles.card, { borderRadius: theme.radius.l + 4 }]}>
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="balanceGradient" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={stops[0]} />
              <Stop offset="1" stopColor={stops[1]} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#balanceGradient)" />
          {/* Decorative translucent circles */}
          <Circle cx="88%" cy="-8%" r="90" fill="rgba(255,255,255,0.10)" />
          <Circle cx="102%" cy="30%" r="46" fill="rgba(255,255,255,0.07)" />
          <Circle cx="6%" cy="110%" r="70" fill="rgba(255,255,255,0.06)" />
        </Svg>

        <AppText variant="caption" style={styles.label}>
          Balance this month
        </AppText>
        <AppText variant="display" style={styles.balance} tabular>
          {formatCurrency(balance)}
        </AppText>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <View style={styles.statIcon}>
              <ArrowDownLeftIcon size={16} color={WHITE} />
            </View>
            <View>
              <AppText variant="caption" style={styles.label}>
                Income
              </AppText>
              <AppText variant="bodyStrong" style={styles.statValue} tabular>
                {formatCurrency(income)}
              </AppText>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.stat}>
            <View style={styles.statIcon}>
              <ArrowUpRightIcon size={16} color={WHITE} />
            </View>
            <View>
              <AppText variant="caption" style={styles.label}>
                Expense
              </AppText>
              <AppText variant="bodyStrong" style={styles.statValue} tabular>
                {formatCurrency(expense)}
              </AppText>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    padding: 22,
  },
  label: { color: 'rgba(255,255,255,0.75)' },
  balance: { color: WHITE, marginTop: 2 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    gap: 16,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { color: WHITE },
  divider: { width: StyleSheet.hairlineWidth, height: 34, backgroundColor: 'rgba(255,255,255,0.30)' },
});
