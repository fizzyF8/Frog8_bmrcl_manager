import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/context/theme';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'outlined' | 'elevated';
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
  contentStyle,
}) => {
  const { theme } = useTheme();

  const getCardStyle = () => {
    switch (variant) {
      case 'outlined':
        return {
          ...styles.card,
          ...styles.outlined,
          borderColor: theme.border,
        };
      case 'elevated':
        return {
          ...styles.card,
          ...styles.elevated,
        };
      case 'default':
      default:
        return {
          ...styles.card,
          backgroundColor: theme.card,
        };
    }
  };

  return (
    <View style={[getCardStyle(), style]}>
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  outlined: {
    borderWidth: 1,
  },
  elevated: {
    ...SHADOWS.md,
  },
  content: {
    padding: SPACING.md,
  },
});

export default Card;