// Material Design 3 Color Palettes
// 预设主题色配置

export interface ColorPalette {
  id: string;
  name: string;
  nameZh: string;
  // Light theme colors
  primaryLight: string;
  onPrimaryLight: string;
  surfaceLight: string;
  onSurfaceLight: string;
  onSurfaceVariantLight: string;
  outlineVariantLight: string;
  surfaceContainerLight: string;
  onSurfaceContainerLight: string;
  errorLight: string;
  glassBgLight: string;
  codeBgLight: string;
  userBubbleBgLight: string;
  // Dark theme colors
  primaryDark: string;
  onPrimaryDark: string;
  surfaceDark: string;
  onSurfaceDark: string;
  onSurfaceVariantDark: string;
  outlineVariantDark: string;
  surfaceContainerDark: string;
  onSurfaceContainerDark: string;
  errorDark: string;
  glassBgDark: string;
  codeBgDark: string;
  userBubbleBgDark: string;
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: 'neutral',
    name: '中性灰',
    nameZh: '中性灰',
    // Light - 基于 #faf9f5 的柔和灰色系
    primaryLight: '#8B8680',  // 柔和的中性灰作为主色
    onPrimaryLight: '#ffffff',
    surfaceLight: '#FAF9F5',  // 主背景色：偏白的暖灰色
    onSurfaceLight: '#2B2926',  // 深灰色文字
    onSurfaceVariantLight: '#6B6763',  // 次要文字颜色
    outlineVariantLight: '#E3E1DB',  // 边框颜色
    surfaceContainerLight: '#F0EEE8',  // 容器背景
    onSurfaceContainerLight: '#2B2926',
    errorLight: '#C65746',  // 柔和的错误红
    glassBgLight: 'rgba(250, 249, 245, 0.75)',  // 玻璃效果
    codeBgLight: '#EEECE6',  // 代码背景
    userBubbleBgLight: '#F3F1EB',  // 用户气泡：非常接近背景的浅灰色，低对比度
    // Dark
    primaryDark: '#A8A39D',  // 深色模式的柔和灰
    onPrimaryDark: '#1a1917',
    surfaceDark: '#1C1B19',  // 深色背景
    onSurfaceDark: '#E8E6E0',
    onSurfaceVariantDark: '#A39F9A',
    outlineVariantDark: '#3D3B37',
    surfaceContainerDark: '#282725',
    onSurfaceContainerDark: '#E8E6E0',
    errorDark: '#E07A6A',
    glassBgDark: 'rgba(28, 27, 25, 0.75)',
    codeBgDark: '#242321',
    userBubbleBgDark: '#2F2D2A',  // 深色模式用户气泡
  },
  {
    id: 'blue',
    name: '蓝色',
    nameZh: '蓝色',
    // Light
    primaryLight: '#5CA3FF',
    onPrimaryLight: '#ffffff',
    surfaceLight: '#F9FBFF',
    onSurfaceLight: '#1a1c1e',
    onSurfaceVariantLight: '#6B7280',
    outlineVariantLight: '#D1D5DB',
    surfaceContainerLight: '#E3E8F0',
    onSurfaceContainerLight: '#1a1c1e',
    errorLight: '#FF6B6B',
    glassBgLight: 'rgba(249, 251, 255, 0.6)',
    codeBgLight: '#F3F4F6',
    userBubbleBgLight: '#EBF4FF',
    // Dark
    primaryDark: '#3B82F6',
    onPrimaryDark: '#ffffff',
    surfaceDark: '#1a1c1e',
    onSurfaceDark: '#E3E2E6',
    onSurfaceVariantDark: '#9CA3AF',
    outlineVariantDark: '#4B5563',
    surfaceContainerDark: '#2D3748',
    onSurfaceContainerDark: '#E3E2E6',
    errorDark: '#F87171',
    glassBgDark: 'rgba(45, 55, 72, 0.6)',
    codeBgDark: '#374151',
    userBubbleBgDark: '#1E3A8A',
  },
  {
    id: 'orange',
    name: '橙色',
    nameZh: '橙色',
    // Light
    primaryLight: '#FFA726',
    onPrimaryLight: '#ffffff',
    surfaceLight: '#FFF8F0',
    onSurfaceLight: '#1a1c1e',
    onSurfaceVariantLight: '#6B7280',
    outlineVariantLight: '#D1D5DB',
    surfaceContainerLight: '#F0E6D6',
    onSurfaceContainerLight: '#1a1c1e',
    errorLight: '#FF8A80',
    glassBgLight: 'rgba(255, 248, 240, 0.6)',
    codeBgLight: '#FFF5E6',
    userBubbleBgLight: '#FFE8CC',
    // Dark
    primaryDark: '#FF8F00',
    onPrimaryDark: '#ffffff',
    surfaceDark: '#1a1c1e',
    onSurfaceDark: '#E3E2E6',
    onSurfaceVariantDark: '#9CA3AF',
    outlineVariantDark: '#4B5563',
    surfaceContainerDark: '#374151',
    onSurfaceContainerDark: '#E3E2E6',
    errorDark: '#FFAB91',
    glassBgDark: 'rgba(55, 65, 81, 0.6)',
    codeBgDark: '#4B5563',
    userBubbleBgDark: '#7C2D12',
  },
  {
    id: 'green',
    name: '绿色',
    nameZh: '绿色',
    // Light
    primaryLight: '#66BB6A',
    onPrimaryLight: '#ffffff',
    surfaceLight: '#F1F8F4',
    onSurfaceLight: '#1a1c1e',
    onSurfaceVariantLight: '#6B7280',
    outlineVariantLight: '#D1D5DB',
    surfaceContainerLight: '#D4EADC',
    onSurfaceContainerLight: '#1a1c1e',
    errorLight: '#FF8A80',
    glassBgLight: 'rgba(241, 248, 244, 0.6)',
    codeBgLight: '#F0FDF4',
    userBubbleBgLight: '#E8F5E8',
    // Dark
    primaryDark: '#4CAF50',
    onPrimaryDark: '#ffffff',
    surfaceDark: '#1a1c1e',
    onSurfaceDark: '#E3E2E6',
    onSurfaceVariantDark: '#9CA3AF',
    outlineVariantDark: '#4B5563',
    surfaceContainerDark: '#374151',
    onSurfaceContainerDark: '#E3E2E6',
    errorDark: '#FFAB91',
    glassBgDark: 'rgba(55, 65, 81, 0.6)',
    codeBgDark: '#4B5563',
    userBubbleBgDark: '#14532D',
  },
  {
    id: 'purple',
    name: '紫色',
    nameZh: '紫色',
    // Light
    primaryLight: '#BA68C8',
    onPrimaryLight: '#ffffff',
    surfaceLight: '#F8F4FF',
    onSurfaceLight: '#1a1c1e',
    onSurfaceVariantLight: '#6B7280',
    outlineVariantLight: '#D1D5DB',
    surfaceContainerLight: '#E8DFF6',
    onSurfaceContainerLight: '#1a1c1e',
    errorLight: '#FF8A80',
    glassBgLight: 'rgba(248, 244, 255, 0.6)',
    codeBgLight: '#F5F0FF',
    userBubbleBgLight: '#F3E8FF',
    // Dark
    primaryDark: '#9C27B0',
    onPrimaryDark: '#ffffff',
    surfaceDark: '#1a1c1e',
    onSurfaceDark: '#E3E2E6',
    onSurfaceVariantDark: '#9CA3AF',
    outlineVariantDark: '#4B5563',
    surfaceContainerDark: '#374151',
    onSurfaceContainerDark: '#E3E2E6',
    errorDark: '#FFAB91',
    glassBgDark: 'rgba(55, 65, 81, 0.6)',
    codeBgDark: '#4B5563',
    userBubbleBgDark: '#581C87',
  },
  {
    id: 'indigo',
    name: '靛蓝',
    nameZh: '靛蓝',
    // Light
    primaryLight: '#5C6BC0',
    onPrimaryLight: '#ffffff',
    surfaceLight: '#F3F4FF',
    onSurfaceLight: '#1a1c1e',
    onSurfaceVariantLight: '#6B7280',
    outlineVariantLight: '#D1D5DB',
    surfaceContainerLight: '#E0E7FF',
    onSurfaceContainerLight: '#1a1c1e',
    errorLight: '#FF8A80',
    glassBgLight: 'rgba(243, 244, 255, 0.6)',
    codeBgLight: '#EEF2FF',
    userBubbleBgLight: '#E8EAFF',
    // Dark
    primaryDark: '#3F51B5',
    onPrimaryDark: '#ffffff',
    surfaceDark: '#1a1c1e',
    onSurfaceDark: '#E3E2E6',
    onSurfaceVariantDark: '#9CA3AF',
    outlineVariantDark: '#4B5563',
    surfaceContainerDark: '#374151',
    onSurfaceContainerDark: '#E3E2E6',
    errorDark: '#FFAB91',
    glassBgDark: 'rgba(55, 65, 81, 0.6)',
    codeBgDark: '#4B5563',
    userBubbleBgDark: '#1E3A8A',
  },
  {
    id: 'cyan',
    name: '青色',
    nameZh: '青色',
    // Light
    primaryLight: '#4FC3F7',
    onPrimaryLight: '#ffffff',
    surfaceLight: '#F0F9FF',
    onSurfaceLight: '#1a1c1e',
    onSurfaceVariantLight: '#6B7280',
    outlineVariantLight: '#D1D5DB',
    surfaceContainerLight: '#D6EFFF',
    onSurfaceContainerLight: '#1a1c1e',
    errorLight: '#FF8A80',
    glassBgLight: 'rgba(240, 249, 255, 0.6)',
    codeBgLight: '#E0F2FE',
    userBubbleBgLight: '#E0F2FE',
    // Dark
    primaryDark: '#03A9F4',
    onPrimaryDark: '#ffffff',
    surfaceDark: '#1a1c1e',
    onSurfaceDark: '#E3E2E6',
    onSurfaceVariantDark: '#9CA3AF',
    outlineVariantDark: '#4B5563',
    surfaceContainerDark: '#374151',
    onSurfaceContainerDark: '#E3E2E6',
    errorDark: '#FFAB91',
    glassBgDark: 'rgba(55, 65, 81, 0.6)',
    codeBgDark: '#4B5563',
    userBubbleBgDark: '#164E63',
  },
  {
    id: 'pink',
    name: '粉色',
    nameZh: '粉色',
    // Light
    primaryLight: '#F48FB1',
    onPrimaryLight: '#ffffff',
    surfaceLight: '#FFF5FA',
    onSurfaceLight: '#1a1c1e',
    onSurfaceVariantLight: '#6B7280',
    outlineVariantLight: '#D1D5DB',
    surfaceContainerLight: '#FCE4EC',
    onSurfaceContainerLight: '#1a1c1e',
    errorLight: '#FF8A80',
    glassBgLight: 'rgba(255, 245, 250, 0.6)',
    codeBgLight: '#FCE4EC',
    userBubbleBgLight: '#FCE4EC',
    // Dark
    primaryDark: '#E91E63',
    onPrimaryDark: '#ffffff',
    surfaceDark: '#1a1c1e',
    onSurfaceDark: '#E3E2E6',
    onSurfaceVariantDark: '#9CA3AF',
    outlineVariantDark: '#4B5563',
    surfaceContainerDark: '#374151',
    onSurfaceContainerDark: '#E3E2E6',
    errorDark: '#FFAB91',
    glassBgDark: 'rgba(55, 65, 81, 0.6)',
    codeBgDark: '#4B5563',
    userBubbleBgDark: '#8B1538',
  },
];

export const getColorPalette = (id: string): ColorPalette | undefined => {
  return COLOR_PALETTES.find(palette => palette.id === id);
};

export const getDefaultColorPalette = (): ColorPalette => {
  return COLOR_PALETTES[0]; // 中性灰 (Neutral Gray)
};