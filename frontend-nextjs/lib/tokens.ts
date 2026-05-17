/**
 * Synapse design tokens — JS mirror of globals.css custom properties.
 * Use these anywhere CSS variables aren't accessible (Chart.js, canvas, etc.)
 */

export const colors = {
  /* Backgrounds */
  bgBase:     '#032425',
  bgSurface:  '#0A3D3E',
  bgElevated: '#0F4F50',

  /* Borders */
  borderSubtle: '#416858',
  borderDim:    'rgba(65, 104, 88, 0.4)',
  borderBright: 'rgba(241, 255, 88, 0.25)',

  /* Text */
  textPrimary:   '#E8F5F5',
  textSecondary: '#C8DCDC',
  textDim:       '#7FA8A8',

  /* Signal colors */
  yellow:      '#F1FF58',
  yellowDim:   'rgba(241, 255, 88, 0.12)',

  red:         '#FF3A6E',
  redDim:      'rgba(255, 58, 110, 0.12)',

  purple:      '#7B2FBE',
  purpleLight: '#C084FC',
  purpleDim:   'rgba(123, 47, 190, 0.12)',

  amber:       '#F5A623',
  amberDim:    'rgba(245, 166, 35, 0.12)',
} as const

export const font = {
  mono: "'IBM Plex Mono', 'Fira Code', monospace",
  sans: "'DM Sans', system-ui, sans-serif",
} as const

export const radius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
} as const

/** Chart.js default config — import and spread into your chart options */
export const chartDefaults = {
  color: colors.textSecondary,
  borderColor: colors.borderDim,
  backgroundColor: 'transparent',
  font: { family: font.mono, size: 10 },
} as const

export const chartGridStyle = {
  color: 'rgba(65, 104, 88, 0.25)',
  drawBorder: false,
  tickLength: 0,
} as const

export const chartTickStyle = {
  color: colors.textDim,
  font: { family: font.mono, size: 9 },
  padding: 8,
} as const

export type SignalType = 'high' | 'monitor' | 'normal' | 'none'

export const signalConfig: Record<SignalType, { color: string; label: string; glassClass: string; badgeClass: string }> = {
  high:    { color: colors.red,    label: 'HIGH CONFIDENCE', glassClass: 'glass-red',    badgeClass: 'badge-red'    },
  monitor: { color: colors.amber,  label: 'MONITOR',         glassClass: 'glass-amber',  badgeClass: 'badge-amber'  },
  normal:  { color: colors.purple, label: 'NORMAL',          glassClass: 'glass-purple', badgeClass: 'badge-purple' },
  none:    { color: colors.yellow, label: 'STABLE',          glassClass: 'glass-yellow', badgeClass: 'badge-yellow' },
}