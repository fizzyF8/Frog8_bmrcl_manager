import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONTS, FONT_SIZES } from '@/constants/theme';
import { haptics } from '@/utils/haptics';

type ButtonVariant = 'filled' | 'outlined' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonColor = 'primary' | 'secondary' | 'success' | 'error' | 'warning';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: ButtonColor;
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  onPress?: (e: any) => void;
}

const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'filled',
  size = 'md',
  color = 'primary',
  fullWidth = false,
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  onPress,
  ...props
}) => {
  const getBackgroundColor = () => {
    if (disabled) return COLORS.neutral[300];
    if (variant === 'filled') {
      return COLORS[color]?.light || COLORS.primary.light;
    }
    return COLORS.transparent;
  };

  const getTextColor = () => {
    if (disabled) return COLORS.neutral[500];
    if (variant === 'filled') {
      return COLORS.white;
    }
    return COLORS[color]?.light || COLORS.primary.light;
  };

  const getBorderColor = () => {
    if (disabled) return COLORS.neutral[300];
    return COLORS[color]?.light || COLORS.primary.light;
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md };
      case 'lg':
        return { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg };
      case 'md':
      default:
        return { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return FONT_SIZES.sm;
      case 'lg':
        return FONT_SIZES.lg;
      case 'md':
      default:
        return FONT_SIZES.md;
    }
  };

  const buttonStyles = [
    styles.button,
    {
      backgroundColor: getBackgroundColor(),
      borderColor: variant === 'outlined' ? getBorderColor() : 'transparent',
      borderWidth: variant === 'outlined' ? 1 : 0,
      ...getPadding(),
    },
    fullWidth && styles.fullWidth,
    style,
  ];

  const textStyles = [
    styles.text,
    {
      color: getTextColor(),
      fontSize: getFontSize(),
    },
    textStyle,
  ];

  const handlePress = (e: any) => {
    if (!disabled && !loading) {
      haptics.light();
      onPress?.(e);
    }
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      disabled={disabled || loading}
      activeOpacity={0.8}
      onPress={handlePress}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {leftIcon && leftIcon}
          <Text style={textStyles}>{title}</Text>
          {rightIcon && rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs,
  },
  text: {
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
});

export default Button;