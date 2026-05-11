/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const colorAliases = {
  text: Colors.textPrimary,
  icon: Colors.textSecondary,
} as const;

type ThemeColorName = keyof typeof Colors | keyof typeof colorAliases;

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: ThemeColorName
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }

  if (colorName in Colors) {
    return Colors[colorName as keyof typeof Colors];
  }

  return colorAliases[colorName as keyof typeof colorAliases];
}
