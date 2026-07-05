import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { useTheme } from '../../theme/ThemeProvider';
import { MonthPoint } from '../../types/api';
import { formatMonthLabel } from '../../utils/format';
import { AppText } from '../AppText';

interface TrendBarChartProps {
  data: MonthPoint[];
  height?: number;
}

/**
 * Paired-bar income vs expense trend. One y-scale for both series (never dual
 * axis); thin bars with rounded data-ends anchored to the baseline; a legend
 * is always shown since there are two series.
 */
export function TrendBarChart({ data, height = 140 }: TrendBarChartProps) {
  const { theme } = useTheme();
  const [layoutWidth, setLayoutWidth] = React.useState(0);

  const incomeColor = theme.colors.chartCategorical[0]; // slot 1 blue
  const expenseColor = theme.colors.chartCategorical[7]; // slot 8 orange

  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const chartH = height - 22; // reserve space for month labels
  const barW = 7;
  const pairGap = 3;

  const groupWidth = layoutWidth > 0 ? layoutWidth / data.length : 0;

  return (
    <View>
      <View onLayout={(e) => setLayoutWidth(e.nativeEvent.layout.width)}>
        {layoutWidth > 0 && (
          <Svg width={layoutWidth} height={height}>
            {/* baseline */}
            <Line
              x1={0}
              y1={chartH}
              x2={layoutWidth}
              y2={chartH}
              stroke={theme.colors.chartAxis}
              strokeWidth={1}
            />
            {data.map((d, i) => {
              const cx = groupWidth * i + groupWidth / 2;
              const incomeH = Math.max(2, (d.income / max) * (chartH - 8));
              const expenseH = Math.max(2, (d.expense / max) * (chartH - 8));
              return (
                <React.Fragment key={d.month}>
                  <Rect
                    x={cx - barW - pairGap / 2}
                    y={chartH - incomeH}
                    width={barW}
                    height={incomeH}
                    rx={3.5}
                    fill={incomeColor}
                  />
                  <Rect
                    x={cx + pairGap / 2}
                    y={chartH - expenseH}
                    width={barW}
                    height={expenseH}
                    rx={3.5}
                    fill={expenseColor}
                  />
                </React.Fragment>
              );
            })}
          </Svg>
        )}
        {/* Month labels under each group */}
        <View style={styles.labels}>
          {data.map((d) => (
            <AppText key={d.month} variant="caption" tone="muted" style={styles.label}>
              {formatMonthLabel(d.month)}
            </AppText>
          ))}
        </View>
      </View>

      <View style={[styles.legend, { gap: theme.space.l, marginTop: theme.space.s }]}>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: incomeColor }]} />
          <AppText variant="caption" tone="secondary">
            Income
          </AppText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: expenseColor }]} />
          <AppText variant="caption" tone="secondary">
            Expense
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labels: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
  },
  label: { flex: 1, textAlign: 'center' },
  legend: { flexDirection: 'row', justifyContent: 'center' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});
