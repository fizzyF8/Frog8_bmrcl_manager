import { Platform } from 'react-native';

export const COLORS = {
  primary: {
    light: '#2ECC71', // Green
    dark: '#27AE60',
  },
  secondary: {
    light: '#8E44AD', // Purple
    dark: '#7D3C98',
  },
  accent: {
    light: '#3498DB', // Blue
    dark: '#2980B9',
  },
  success: {
    light: '#2ECC71',
    dark: '#27AE60',
  },
  warning: {
    light: '#F39C12',
    dark: '#E67E22',
  },
  error: {
    light: '#E74C3C',
    dark: '#C0392B',
  },
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const FONTS = {
  regular: Platform.select({
    web: 'Inter-Regular, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    default: 'Inter-Regular',
  }),
  medium: Platform.select({
    web: 'Inter-Medium, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    default: 'Inter-Medium',
  }),
  bold: Platform.select({
    web: 'Inter-Bold, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    default: 'Inter-Bold',
  }),
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
};

export const FONT_WEIGHTS = {
  regular: '400',
  medium: '500',
  bold: '700',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};