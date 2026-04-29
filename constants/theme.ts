import { Platform } from 'react-native'

export const Colors = {
  // Backgrounds
  background: '#FAFAF8',
  surface: '#F4F3F0',
  border: '#E8E6E1',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6560',
  textTertiary: '#A8A39D',

  // Accent
  accent: '#C17F5A',
  accentLight: '#F5EDE6',

  // Semantic
  raved: '#5A8A6A',
  ravedLight: '#EBF2ED',
  delisted: '#A8A39D',
  delistedLight: '#F4F3F0',

  // Tab bar
  tabActive: '#1A1A1A',
  tabInactive: '#A8A39D',
}

export const Fonts = Platform.select({
  ios: {
    serif: 'ui-serif',
    sans: 'system-ui',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    serif: 'serif',
    sans: 'normal',
    rounded: 'normal',
    mono: 'monospace',
  },
})

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
}

export const Shadow = {
  soft: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
}
