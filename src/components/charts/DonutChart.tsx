import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeProvider';
import { formatCurrency } from '../../utils/format';
import { AppText } from '../AppText';

export interface DonutDatum {
  label: string;
  value: number;
}

interface DonutChartProps {
  data: DonutDatum[];
  size?: number;
  /** Center label (e.g. total spend). */
  centerLabel?: string;
  centerValue?: string;
  /** Tapping a legend row (e.g. to filter the expense list by that category). */
  onSlicePress?: (label: string) => void;
}

const TAU = Math.PI * 2;

function arcPath(cx: number, cy: number, r: number, start: number, end: number): string {
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const largeArc = end - start > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

/**
 * Donut chart with the validated categorical palette. Colors are assigned by
 * slot order (never cycled); a 9th+ slice folds into "Other" upstream. The
 * legend always shows label + value — several palette slots sit below 3:1
 * contrast on light surfaces, so identity is never carried by color alone.
 */
export function DonutChart({ data, size = 160, centerLabel, centerValue, onSlicePress }: DonutChartProps) {
  const { theme } = useTheme();
  const palette = theme.colors.chartCategorical;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 10;
  const strokeWidth = 18;

  // 2px surface gap between segments, expressed as an angular spacer
  const gapAngle = total > 0 ? (2.5 / (TAU * r)) * TAU : 0;

  let cursor = -Math.PI / 2; // start at 12 o'clock

  return (
    <View style={styles.row}>
      <View accessibilityRole="image" accessibilityLabel={`Spending split: ${data.map((d) => `${d.label} ${Math.round((d.value / total) * 100)}%`).join(', ')}`}>
        <Svg width={size} height={size}>
          {data.length === 1 ? (
            <Circle
              cx={cx}
              cy={cy}
              r={r}
              stroke={palette[0]}
              strokeWidth={strokeWidth}
              fill="none"
            />
          ) : (
            <G>
              {data.map((d, i) => {
                const sweep = (d.value / total) * TAU;
                const start = cursor + gapAngle / 2;
                const end = cursor + sweep - gapAngle / 2;
                cursor += sweep;
                if (end <= start) return null;
                return (
                  <Path
                    key={d.label}
                    d={arcPath(cx, cy, r, start, end)}
                    stroke={palette[i % palette.length]}
                    strokeWidth={strokeWidth}
                    strokeLinecap="butt"
                    fill="none"
                  />
                );
              })}
            </G>
          )}
        </Svg>
        {(centerLabel || centerValue) && (
          <View style={[StyleSheet.absoluteFill, styles.center]}>
            {centerValue ? (
              <AppText variant="bodyStrong" tabular>
                {centerValue}
              </AppText>
            ) : null}
            {centerLabel ? (
              <AppText variant="caption" tone="muted">
                {centerLabel}
              </AppText>
            ) : null}
          </View>
        )}
      </View>

      {/* Legend: colored dot + label + amount, one row per slice */}
      <View style={[styles.legend, { gap: theme.space.s }]}>
        {data.map((d, i) => (
          <Pressable
            key={d.label}
            style={styles.legendRow}
            onPress={onSlicePress ? () => onSlicePress(d.label) : undefined}
            accessibilityRole={onSlicePress ? 'button' : undefined}
            accessibilityLabel={onSlicePress ? `Filter expenses by ${d.label}` : undefined}
          >
            <View
              style={[styles.dot, { backgroundColor: palette[i % palette.length] }]}
            />
            <AppText variant="caption" tone="secondary" style={styles.legendLabel} numberOfLines={1}>
              {d.label}
            </AppText>
            <AppText variant="caption" tabular>
              {formatCurrency(d.value)}
            </AppText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  center: { alignItems: 'center', justifyContent: 'center' },
  legend: { flex: 1 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1 },
});
