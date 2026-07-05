/**
 * Design tokens — the single source of truth for the visual system.
 * Values come from docs/design-system.md; the chart palette is validated
 * (CVD separation + surface contrast) in both modes.
 */

export const space = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  s: 8,
  m: 14,
  l: 20,
  xl: 28,
  full: 999,
} as const;

export const typography = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700' },
  h1: { fontSize: 26, lineHeight: 32, fontWeight: '700' },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.4 },
} as const;

export const duration = {
  fast: 150,
  base: 250,
  slow: 400,
} as const;

export interface ThemeColors {
  brandPrimary: string;
  brandPrimaryPressed: string;
  brandOnPrimary: string;
  brandSubtle: string;

  bgPage: string;
  bgSurface: string;
  bgSurfaceRaised: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  borderHairline: string;

  statusGood: string;
  statusWarning: string;
  statusSerious: string;
  statusCritical: string;

  /** Categorical chart palette — fixed slot order, never cycled. */
  chartCategorical: string[];
  /** Sequential ramp (light→dark) for progress rings. */
  chartSequential: string[];
  chartGrid: string;
  chartAxis: string;
}

export const lightColors: ThemeColors = {
  brandPrimary: '#4F46E5',
  brandPrimaryPressed: '#4338CA',
  brandOnPrimary: '#FFFFFF',
  brandSubtle: '#EEF0FF',

  bgPage: '#EEF0F7',
  bgSurface: '#FFFFFF',
  bgSurfaceRaised: '#FFFFFF',

  textPrimary: '#0B0B0F',
  textSecondary: '#54536B',
  textMuted: '#8B8AA0',

  borderHairline: 'rgba(11,11,15,0.08)',

  statusGood: '#0ca30c',
  statusWarning: '#fab219',
  statusSerious: '#ec835a',
  statusCritical: '#d03b3b',

  chartCategorical: [
    '#2a78d6', // 1 blue
    '#1baf7a', // 2 aqua
    '#eda100', // 3 yellow
    '#008300', // 4 green
    '#4a3aa7', // 5 violet
    '#e34948', // 6 red
    '#e87ba4', // 7 magenta
    '#eb6834', // 8 orange
  ],
  chartSequential: [
    '#cde2fb',
    '#86b6ef',
    '#3987e5',
    '#2a78d6',
    '#256abf',
    '#1c5cab',
    '#184f95',
    '#0d366b',
  ],
  chartGrid: '#e1e0d9',
  chartAxis: '#c3c2b7',
};

export const darkColors: ThemeColors = {
  brandPrimary: '#818CF8',
  brandPrimaryPressed: '#6366F1',
  brandOnPrimary: '#0F0E17',
  brandSubtle: '#211F36',

  bgPage: '#0F0E17',
  bgSurface: '#1A1926',
  bgSurfaceRaised: '#211F36',

  textPrimary: '#FFFFFF',
  textSecondary: '#C3C2D6',
  textMuted: '#8B8AA0',

  borderHairline: 'rgba(255,255,255,0.10)',

  statusGood: '#0ca30c',
  statusWarning: '#fab219',
  statusSerious: '#ec835a',
  statusCritical: '#d03b3b',

  chartCategorical: [
    '#3987e5',
    '#199e70',
    '#c98500',
    '#008300',
    '#9085e9',
    '#e66767',
    '#d55181',
    '#d95926',
  ],
  chartSequential: [
    '#cde2fb',
    '#86b6ef',
    '#3987e5',
    '#2a78d6',
    '#256abf',
    '#1c5cab',
    '#184f95',
    '#0d366b',
  ],
  chartGrid: '#2c2c2a',
  chartAxis: '#383835',
};

export interface Theme {
  dark: boolean;
  colors: ThemeColors;
  space: typeof space;
  radius: typeof radius;
  typography: typeof typography;
  duration: typeof duration;
}

export const lightTheme: Theme = {
  dark: false,
  colors: lightColors,
  space,
  radius,
  typography,
  duration,
};

export const darkTheme: Theme = {
  dark: true,
  colors: darkColors,
  space,
  radius,
  typography,
  duration,
};
