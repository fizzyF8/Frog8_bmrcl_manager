import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, FONTS, FONT_SIZES } from '@/constants/theme';

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'default';
type BadgeSize = 'sm' | 'md' | 'lg';

interface StatusBadgeProps {
  label: string;
  type?: StatusType;
  size?: BadgeSize;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  type = 'default',
  size = 'md',
  style,
  textStyle,
}) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return COLORS.success.light;
      case 'warning':
        return COLORS.warning.light;
      case 'error':
        return COLORS.error.light;
      case 'info':
        return COLORS.accent.light;
      default:
        return COLORS.neutral[200];
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
      case 'warning':
      case 'error':
      case 'info':
        return COLORS.white;
      default:
        return COLORS.neutral[800];
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return FONT_SIZES.xs;
      case 'lg':
        return FONT_SIZES.md;
      default:
        return FONT_SIZES.sm;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: SPACING.xs / 2,
          paddingHorizontal: SPACING.xs,
        };
      case 'lg':
        return {
          paddingVertical: SPACING.sm,
          paddingHorizontal: SPACING.md,
        };
      default:
        return {
          paddingVertical: SPACING.xs,
          paddingHorizontal: SPACING.sm,
        };
    }
  };

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: getBackgroundColor(),
          ...getPadding(),
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: getTextColor(),
            fontSize: getFontSize(),
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: FONTS.medium,
    textAlign: 'center',
  },
});

export default StatusBadge;