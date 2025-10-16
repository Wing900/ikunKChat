import { argbFromHex, themeFromSourceColor, hexFromArgb } from "@material/material-color-utilities";

export interface Md3Palette {
  light: Record<string, string>;
  dark: Record<string, string>;
}

export function generateMd3Palette(sourceColorHex: string): Md3Palette {
  const theme = themeFromSourceColor(argbFromHex(sourceColorHex));

  const lightPalette: Record<string, string> = {};
  const darkPalette: Record<string, string> = {};

  // Primary
  lightPalette['--md-sys-color-primary'] = hexFromArgb(theme.schemes.light.primary);
  lightPalette['--md-sys-color-on-primary'] = hexFromArgb(theme.schemes.light.onPrimary);
  lightPalette['--md-sys-color-primary-container'] = hexFromArgb(theme.schemes.light.primaryContainer);
  lightPalette['--md-sys-color-on-primary-container'] = hexFromArgb(theme.schemes.light.onPrimaryContainer);

  darkPalette['--md-sys-color-primary'] = hexFromArgb(theme.schemes.dark.primary);
  darkPalette['--md-sys-color-on-primary'] = hexFromArgb(theme.schemes.dark.onPrimary);
  darkPalette['--md-sys-color-primary-container'] = hexFromArgb(theme.schemes.dark.primaryContainer);
  darkPalette['--md-sys-color-on-primary-container'] = hexFromArgb(theme.schemes.dark.onPrimaryContainer);

  // Secondary
  lightPalette['--md-sys-color-secondary'] = hexFromArgb(theme.schemes.light.secondary);
  lightPalette['--md-sys-color-on-secondary'] = hexFromArgb(theme.schemes.light.onSecondary);
  lightPalette['--md-sys-color-secondary-container'] = hexFromArgb(theme.schemes.light.secondaryContainer);
  lightPalette['--md-sys-color-on-secondary-container'] = hexFromArgb(theme.schemes.light.onSecondaryContainer);

  darkPalette['--md-sys-color-secondary'] = hexFromArgb(theme.schemes.dark.secondary);
  darkPalette['--md-sys-color-on-secondary'] = hexFromArgb(theme.schemes.dark.onSecondary);
  darkPalette['--md-sys-color-secondary-container'] = hexFromArgb(theme.schemes.dark.secondaryContainer);
  darkPalette['--md-sys-color-on-secondary-container'] = hexFromArgb(theme.schemes.dark.onSecondaryContainer);

  // Tertiary
  lightPalette['--md-sys-color-tertiary'] = hexFromArgb(theme.schemes.light.tertiary);
  lightPalette['--md-sys-color-on-tertiary'] = hexFromArgb(theme.schemes.light.onTertiary);
  lightPalette['--md-sys-color-tertiary-container'] = hexFromArgb(theme.schemes.light.tertiaryContainer);
  lightPalette['--md-sys-color-on-tertiary-container'] = hexFromArgb(theme.schemes.light.onTertiaryContainer);

  darkPalette['--md-sys-color-tertiary'] = hexFromArgb(theme.schemes.dark.tertiary);
  darkPalette['--md-sys-color-on-tertiary'] = hexFromArgb(theme.schemes.dark.onTertiary);
  darkPalette['--md-sys-color-tertiary-container'] = hexFromArgb(theme.schemes.dark.tertiaryContainer);
  darkPalette['--md-sys-color-on-tertiary-container'] = hexFromArgb(theme.schemes.dark.onTertiaryContainer);

  // Error
  lightPalette['--md-sys-color-error'] = hexFromArgb(theme.schemes.light.error);
  lightPalette['--md-sys-color-on-error'] = hexFromArgb(theme.schemes.light.onError);
  lightPalette['--md-sys-color-error-container'] = hexFromArgb(theme.schemes.light.errorContainer);
  lightPalette['--md-sys-color-on-error-container'] = hexFromArgb(theme.schemes.light.onErrorContainer);

  darkPalette['--md-sys-color-error'] = hexFromArgb(theme.schemes.dark.error);
  darkPalette['--md-sys-color-on-error'] = hexFromArgb(theme.schemes.dark.onError);
  darkPalette['--md-sys-color-error-container'] = hexFromArgb(theme.schemes.dark.errorContainer);
  darkPalette['--md-sys-color-on-error-container'] = hexFromArgb(theme.schemes.dark.onErrorContainer);

  // Neutral / Surface
  lightPalette['--md-sys-color-background'] = hexFromArgb(theme.schemes.light.background);
  lightPalette['--md-sys-color-on-background'] = hexFromArgb(theme.schemes.light.onBackground);
  lightPalette['--md-sys-color-surface'] = hexFromArgb(theme.schemes.light.surface);
  lightPalette['--md-sys-color-on-surface'] = hexFromArgb(theme.schemes.light.onSurface);
  lightPalette['--md-sys-color-surface-variant'] = hexFromArgb(theme.schemes.light.surfaceVariant);
  lightPalette['--md-sys-color-on-surface-variant'] = hexFromArgb(theme.schemes.light.onSurfaceVariant);
  lightPalette['--md-sys-color-outline'] = hexFromArgb(theme.schemes.light.outline);
  lightPalette['--md-sys-color-outline-variant'] = hexFromArgb(theme.schemes.light.outlineVariant);
  lightPalette['--md-sys-color-shadow'] = hexFromArgb(theme.schemes.light.shadow);
  lightPalette['--md-sys-color-inverse-surface'] = hexFromArgb(theme.schemes.light.inverseSurface);
  lightPalette['--md-sys-color-inverse-on-surface'] = hexFromArgb(theme.schemes.light.inverseOnSurface);
  lightPalette['--md-sys-color-inverse-primary'] = hexFromArgb(theme.schemes.light.inversePrimary);
  lightPalette['--md-sys-color-surface-tint'] = hexFromArgb(theme.schemes.light.surfaceTint);
  
  // Custom surface containers for glassmorphism effects
  lightPalette['--glass-bg'] = `rgba(${hexToRgb(hexFromArgb(theme.schemes.light.surface)).join(',')}, 0.6)`;
  lightPalette['--code-bg'] = hexFromArgb(theme.palettes.neutral.tone(95)); // A slightly darker neutral for code blocks
  lightPalette['--user-bubble-bg'] = hexFromArgb(theme.palettes.primary.tone(90)); // A lighter primary tone for user bubbles

  darkPalette['--md-sys-color-background'] = hexFromArgb(theme.schemes.dark.background);
  darkPalette['--md-sys-color-on-background'] = hexFromArgb(theme.schemes.dark.onBackground);
  darkPalette['--md-sys-color-surface'] = hexFromArgb(theme.schemes.dark.surface);
  darkPalette['--md-sys-color-on-surface'] = hexFromArgb(theme.schemes.dark.onSurface);
  darkPalette['--md-sys-color-surface-variant'] = hexFromArgb(theme.schemes.dark.surfaceVariant);
  darkPalette['--md-sys-color-on-surface-variant'] = hexFromArgb(theme.schemes.dark.onSurfaceVariant);
  darkPalette['--md-sys-color-outline'] = hexFromArgb(theme.schemes.dark.outline);
  darkPalette['--md-sys-color-outline-variant'] = hexFromArgb(theme.schemes.dark.outlineVariant);
  darkPalette['--md-sys-color-shadow'] = hexFromArgb(theme.schemes.dark.shadow);
  darkPalette['--md-sys-color-inverse-surface'] = hexFromArgb(theme.schemes.dark.inverseSurface);
  darkPalette['--md-sys-color-inverse-on-surface'] = hexFromArgb(theme.schemes.dark.inverseOnSurface);
  darkPalette['--md-sys-color-inverse-primary'] = hexFromArgb(theme.schemes.dark.inversePrimary);
  darkPalette['--md-sys-color-surface-tint'] = hexFromArgb(theme.schemes.dark.surfaceTint);

  // Custom surface containers for glassmorphism effects
  darkPalette['--glass-bg'] = `rgba(${hexToRgb(hexFromArgb(theme.schemes.dark.surface)).join(',')}, 0.6)`;
  darkPalette['--code-bg'] = hexFromArgb(theme.palettes.neutral.tone(10)); // A slightly lighter neutral for code blocks
  darkPalette['--user-bubble-bg'] = hexFromArgb(theme.palettes.primary.tone(20)); // A darker primary tone for user bubbles

  return { light: lightPalette, dark: darkPalette };
}

// Helper to convert hex to RGB array for rgba()
function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}
