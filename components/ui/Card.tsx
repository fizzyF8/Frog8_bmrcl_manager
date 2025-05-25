import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';

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
  const getCardStyle = () => {
    switch (variant) {
      case 'outlined':
        return {
          ...styles.card,
          ...styles.outlined,
        };
      case 'elevated':
        return {
          ...styles.card,
          ...styles.elevated,
        };
      case 'default':
      default:
        return styles.card;
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
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
  },
  outlined: {
    borderWidth: 1,
    borderColor: COLORS.neutral[200],
  },
  elevated: {
    ...SHADOWS.md,
  },
  content: {
    padding: SPACING.md,
  },
});

export default Card;