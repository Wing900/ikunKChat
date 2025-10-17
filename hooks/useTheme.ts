import { useLayoutEffect } from 'react';
import { Settings } from '../types';
import { generateMd3Palette } from '../utils/colorUtils';
import { getColorPalette, getDefaultColorPalette } from '../data/colorPalettes';

/**
 * 管理应用主题和调色板
 * 从 App.tsx 抽离出来，减少顶层组件复杂度
 */
export const useTheme = (settings: Settings, isStorageLoaded: boolean) => {
  useLayoutEffect(() => {
    if (!isStorageLoaded) return;

    const applyColorPalette = () => {
      const isDark = settings.theme.includes('dark');
      
      // 如果有自定义颜色，使用 MD3 生成完整调色板
      if (settings.customColor) {
        try {
          const md3Palette = generateMd3Palette(settings.customColor);
          const colorScheme = isDark ? md3Palette.dark : md3Palette.light;
          
          // 应用所有生成的颜色
          Object.entries(colorScheme).forEach(([key, value]) => {
            document.documentElement.style.setProperty(key, value);
          });
          
          // 额外设置 dynamic 变量以覆盖默认值
          applyCSSVariables({
            '--dynamic-primary': colorScheme['--md-sys-color-primary'],
            '--dynamic-on-primary': colorScheme['--md-sys-color-on-primary'],
            '--dynamic-surface': colorScheme['--md-sys-color-surface'],
            '--dynamic-on-surface': colorScheme['--md-sys-color-on-surface'],
            '--dynamic-on-surface-variant': colorScheme['--md-sys-color-on-surface-variant'],
            '--dynamic-outline-variant': colorScheme['--md-sys-color-outline-variant'],
            '--dynamic-surface-container': colorScheme['--md-sys-color-surface-variant'],
            '--dynamic-on-surface-container': colorScheme['--md-sys-color-on-surface-variant'],
            '--dynamic-error': colorScheme['--md-sys-color-error'],
            '--dynamic-glass-bg': colorScheme['--glass-bg'],
            '--dynamic-code-bg': colorScheme['--code-bg'],
            '--dynamic-user-bubble-bg': colorScheme['--user-bubble-bg'],
          });
          return;
        } catch (error) {
          console.error('[Color] Failed to generate MD3 palette:', error);
        }
      }
      
      // 使用预设调色板
      const paletteId = settings.colorPalette || 'blue';
      const palette = getColorPalette(paletteId) || getDefaultColorPalette();
      
      if (isDark) {
        applyCSSVariables({
          '--dynamic-primary': palette.primaryDark,
          '--dynamic-on-primary': palette.onPrimaryDark,
          '--dynamic-surface': palette.surfaceDark,
          '--dynamic-on-surface': palette.onSurfaceDark,
          '--dynamic-on-surface-variant': palette.onSurfaceVariantDark,
          '--dynamic-outline-variant': palette.outlineVariantDark,
          '--dynamic-surface-container': palette.surfaceContainerDark,
          '--dynamic-on-surface-container': palette.onSurfaceContainerDark,
          '--dynamic-error': palette.errorDark,
          '--dynamic-glass-bg': palette.glassBgDark,
          '--dynamic-code-bg': palette.codeBgDark,
          '--dynamic-user-bubble-bg': palette.userBubbleBgDark,
        });
      } else {
        applyCSSVariables({
          '--dynamic-primary': palette.primaryLight,
          '--dynamic-on-primary': palette.onPrimaryLight,
          '--dynamic-surface': palette.surfaceLight,
          '--dynamic-on-surface': palette.onSurfaceLight,
          '--dynamic-on-surface-variant': palette.onSurfaceVariantLight,
          '--dynamic-outline-variant': palette.outlineVariantLight,
          '--dynamic-surface-container': palette.surfaceContainerLight,
          '--dynamic-on-surface-container': palette.onSurfaceContainerLight,
          '--dynamic-error': palette.errorLight,
          '--dynamic-glass-bg': palette.glassBgLight,
          '--dynamic-code-bg': palette.codeBgLight,
          '--dynamic-user-bubble-bg': palette.userBubbleBgLight,
        });
      }
    };

    applyColorPalette();
  }, [settings.theme, settings.colorPalette, settings.customColor, isStorageLoaded]);
};

/**
 * 辅助函数：批量设置 CSS 变量
 */
function applyCSSVariables(variables: Record<string, string>) {
  Object.entries(variables).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
}